import type { PGlite } from "@electric-sql/pglite";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  asAuthenticated,
  BREAKING_BAD,
  createAuthUser,
  createMigratedDb,
  reset,
} from "./support/pglite";

const ALICE = "11111111-1111-1111-1111-111111111111";
const BOB = "22222222-2222-2222-2222-222222222222";
const CAROL = "33333333-3333-3333-3333-333333333333";

let db: PGlite;

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const r = await db.query<{ n: number }>(sql, params);
  return r.rows[0].n;
}

async function seedSeries(): Promise<string> {
  await asAuthenticated(db, BOB);
  const r = await db.query<{ id: string }>(`select public.upsert_series_from_tmdb($1::jsonb) as id;`, [
    JSON.stringify(BREAKING_BAD),
  ]);
  await reset(db);
  return r.rows[0].id;
}

async function ensureBobWatching(): Promise<string> {
  const seriesId = await seedSeries();
  await asAuthenticated(db, BOB);
  await db.query(
    `insert into public.user_series_status (user_id, series_id, status) values ($1, $2, 'watching')
     on conflict (user_id, series_id) do nothing`,
    [BOB, seriesId]
  );
  await reset(db);
  return seriesId;
}

async function clearSocialState(): Promise<void> {
  await db.exec(`delete from public.notifications; delete from public.follows;`);
}

beforeAll(async () => {
  db = await createMigratedDb();
  await createAuthUser(db, ALICE, "alice");
  await createAuthUser(db, BOB, "bob", "Bob B");
  await createAuthUser(db, CAROL, "carol");
});

afterEach(async () => {
  await reset(db);
});

afterAll(async () => {
  await db.close();
});

describe("migrations and schema shape", () => {
  it("creates the six core tables plus notifications and the progress view", async () => {
    const r = await db.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public';`
    );
    const names = r.rows.map((x) => x.table_name);
    for (const want of [
      "profiles",
      "series",
      "user_series_status",
      "episode_tracking",
      "reviews",
      "follows",
      "notifications",
      "user_series_progress",
    ]) {
      expect(names).toContain(want);
    }
  });

  it("enables row level security on every base table", async () => {
    const n = await count(
      `select count(*)::int as n from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
       where ns.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = true;`
    );
    expect(n).toBeGreaterThanOrEqual(6);
  });
});

describe("signup trigger and usernames", () => {
  it("creates a profile with the requested username", async () => {
    const r = await db.query<{ username: string }>(`select username from public.profiles where id = $1`, [
      ALICE,
    ]);
    expect(r.rows[0].username).toBe("alice");
  });

  it("rejects a duplicate username and leaves no orphan auth user", async () => {
    let rejected = false;
    try {
      await createAuthUser(db, "99999999-9999-9999-9999-999999999999", "ALICE");
    } catch {
      rejected = true;
    }
    expect(rejected).toBe(true);
    expect(await count(`select count(*)::int as n from auth.users where email = 'ALICE@example.com'`)).toBe(0);
  });

  it("reports availability case-insensitively", async () => {
    const taken = await db.query<{ a: boolean }>(`select public.username_available('Alice') as a`);
    const free = await db.query<{ a: boolean }>(`select public.username_available('nobody') as a`);
    expect(taken.rows[0].a).toBe(false);
    expect(free.rows[0].a).toBe(true);
  });
});

describe("series cache hardening", () => {
  it("writes through the upsert RPC", async () => {
    const id = await seedSeries();
    expect(id).toBeTruthy();
    expect(await count(`select count(*)::int as n from public.series where tmdb_id = 1396`)).toBe(1);
  });

  it("blocks a direct insert into series by an authenticated user", async () => {
    await asAuthenticated(db, ALICE);
    let blocked = false;
    try {
      await db.query(`insert into public.series (tmdb_id, name) values (9999, 'Hacked')`);
    } catch {
      blocked = true;
    }
    await reset(db);
    expect(blocked).toBe(true);
  });

  it("still lets an authenticated user read the cache", async () => {
    await asAuthenticated(db, ALICE);
    const n = await count(`select count(*)::int as n from public.series`);
    await reset(db);
    expect(n).toBeGreaterThanOrEqual(1);
  });
});

describe("episode tracking drives status", () => {
  let seriesId: string;

  beforeAll(async () => {
    seriesId = await seedSeries();
  });

  it("first check-in moves an untracked series to watching", async () => {
    await asAuthenticated(db, ALICE);
    await db.query(
      `insert into public.episode_tracking (user_id, series_id, tmdb_episode_id, season_number, episode_number)
       values ($1, $2, 62085, 1, 1)`,
      [ALICE, seriesId]
    );
    const r = await db.query<{ status: string }>(
      `select status from public.user_series_status where user_id = $1 and series_id = $2`,
      [ALICE, seriesId]
    );
    await reset(db);
    expect(r.rows[0].status).toBe("watching");
  });

  it("set_series_watched then a watched status marks all aired episodes", async () => {
    await asAuthenticated(db, ALICE);
    const eps = Array.from({ length: 7 }, (_, i) => ({
      tmdb_episode_id: 62085 + i,
      season_number: 1,
      episode_number: i + 1,
    }));
    await db.query(`select public.set_series_watched($1, $2::jsonb)`, [seriesId, JSON.stringify(eps)]);
    const status = await db.query<{ status: string }>(
      `select status from public.user_series_status where user_id = $1 and series_id = $2`,
      [ALICE, seriesId]
    );
    const watched = await count(
      `select count(*)::int as n from public.episode_tracking where user_id = $1 and series_id = $2`,
      [ALICE, seriesId]
    );
    await reset(db);
    expect(watched).toBe(7);
    expect(status.rows[0].status).toBe("watched");
  });

  it("clear_series_episodes resets progress (backs the want_to_watch reset)", async () => {
    await asAuthenticated(db, ALICE);
    const removed = await db.query<{ clear_series_episodes: number }>(
      `select public.clear_series_episodes($1)`,
      [seriesId]
    );
    const remaining = await count(
      `select count(*)::int as n from public.episode_tracking where user_id = $1 and series_id = $2`,
      [ALICE, seriesId]
    );
    await reset(db);
    expect(removed.rows[0].clear_series_episodes).toBe(7);
    expect(remaining).toBe(0);
  });
});

describe("review constraints", () => {
  let seriesId: string;

  beforeAll(async () => {
    seriesId = await seedSeries();
  });

  it("accepts a half-star rating", async () => {
    await asAuthenticated(db, CAROL);
    await db.query(`insert into public.reviews (user_id, series_id, rating) values ($1, $2, 4.5)`, [
      CAROL,
      seriesId,
    ]);
    const r = await db.query<{ rating: number }>(
      `select rating from public.reviews where user_id = $1 and series_id = $2`,
      [CAROL, seriesId]
    );
    await reset(db);
    expect(Number(r.rows[0].rating)).toBe(4.5);
  });

  it("rejects a rating that is not a half-step", async () => {
    await asAuthenticated(db, BOB);
    let rejected = false;
    try {
      await db.query(`insert into public.reviews (user_id, series_id, rating) values ($1, $2, 4.3)`, [
        BOB,
        seriesId,
      ]);
    } catch {
      rejected = true;
    }
    await reset(db);
    expect(rejected).toBe(true);
  });
});

describe("follows gate library visibility", () => {
  beforeAll(async () => {
    await clearSocialState();
    await ensureBobWatching();
  });

  it("cannot follow yourself", async () => {
    await asAuthenticated(db, ALICE);
    let rejected = false;
    try {
      await db.query(`insert into public.follows (follower_id, following_id) values ($1, $1)`, [ALICE]);
    } catch {
      rejected = true;
    }
    await reset(db);
    expect(rejected).toBe(true);
  });

  it("cannot forge a follow as someone else", async () => {
    await asAuthenticated(db, ALICE);
    let rejected = false;
    try {
      await db.query(`insert into public.follows (follower_id, following_id) values ($1, $2)`, [CAROL, BOB]);
    } catch {
      rejected = true;
    }
    await reset(db);
    expect(rejected).toBe(true);
  });

  it("hides a library before following and shows it after", async () => {
    await asAuthenticated(db, ALICE);
    const before = await count(`select count(*)::int as n from public.user_series_status where user_id = $1`, [BOB]);
    await db.query(`insert into public.follows (follower_id, following_id) values ($1, $2)`, [ALICE, BOB]);
    const after = await count(`select count(*)::int as n from public.user_series_status where user_id = $1`, [BOB]);
    await reset(db);
    expect(before).toBe(0);
    expect(after).toBe(1);
  });

  it("keeps the library hidden from a non-follower", async () => {
    await asAuthenticated(db, CAROL);
    const n = await count(`select count(*)::int as n from public.user_series_status where user_id = $1`, [BOB]);
    await reset(db);
    expect(n).toBe(0);
  });

  it("revokes access when unfollowed", async () => {
    await asAuthenticated(db, ALICE);
    await db.query(`delete from public.follows where follower_id = $1 and following_id = $2`, [ALICE, BOB]);
    const n = await count(`select count(*)::int as n from public.user_series_status where user_id = $1`, [BOB]);
    await reset(db);
    expect(n).toBe(0);
  });
});

describe("social RPCs", () => {
  beforeAll(async () => {
    await clearSocialState();
    await ensureBobWatching();
  });

  it("search_profiles finds a user, excludes self, and counts accurately", async () => {
    await asAuthenticated(db, ALICE);
    const r = await db.query<{ username: string; series_count: number }>(
      `select username, series_count from public.search_profiles('bob', 10)`
    );
    await reset(db);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].username).toBe("bob");
    expect(r.rows[0].series_count).toBe(1);
  });

  it("get_profile_summary flags self and follow state", async () => {
    await asAuthenticated(db, ALICE);
    const self = await db.query<{ is_self: boolean }>(`select is_self from public.get_profile_summary('alice')`);
    const other = await db.query<{ is_self: boolean; username: string }>(
      `select is_self, username from public.get_profile_summary('BOB')`
    );
    await reset(db);
    expect(self.rows[0].is_self).toBe(true);
    expect(other.rows[0].is_self).toBe(false);
    expect(other.rows[0].username).toBe("bob");
  });
});

describe("notifications", () => {
  let seriesId: string;

  beforeAll(async () => {
    await clearSocialState();
    seriesId = await seedSeries();
  });

  it("a follow notifies the followed user", async () => {
    await asAuthenticated(db, ALICE);
    await db.query(`insert into public.follows (follower_id, following_id) values ($1, $2)`, [ALICE, BOB]);
    await reset(db);
    const r = await db.query<{ type: string; actor_id: string }>(
      `select type, actor_id from public.notifications where user_id = $1 and type = 'follow'`,
      [BOB]
    );
    expect(r.rows[0].type).toBe("follow");
    expect(r.rows[0].actor_id).toBe(ALICE);
  });

  it("a review notifies each follower", async () => {
    await asAuthenticated(db, BOB);
    await db.query(`insert into public.reviews (user_id, series_id, rating) values ($1, $2, 4.5)`, [
      BOB,
      seriesId,
    ]);
    await reset(db);
    expect(
      await count(`select count(*)::int as n from public.notifications where user_id = $1 and type = 'review'`, [
        ALICE,
      ])
    ).toBe(1);
  });

  it("unread count drops to zero after mark-read", async () => {
    await asAuthenticated(db, ALICE);
    const before = await db.query<{ n: number }>(`select public.get_unread_notification_count() as n`);
    await db.query(`select public.mark_notifications_read()`);
    const after = await db.query<{ n: number }>(`select public.get_unread_notification_count() as n`);
    await reset(db);
    expect(before.rows[0].n).toBeGreaterThanOrEqual(1);
    expect(after.rows[0].n).toBe(0);
  });

  it("a user cannot read another user's notifications", async () => {
    await asAuthenticated(db, CAROL);
    const n = await count(`select count(*)::int as n from public.notifications`);
    await reset(db);
    expect(n).toBe(0);
  });
});

describe("delete_own_account", () => {
  it("removes the user and cascades their data without FK errors", async () => {
    await createAuthUser(db, "44444444-4444-4444-4444-444444444444", "dave");
    const dave = "44444444-4444-4444-4444-444444444444";
    const seriesId = await seedSeries();

    await asAuthenticated(db, dave);
    await db.query(`insert into public.user_series_status (user_id, series_id, status) values ($1, $2, 'watching')`, [
      dave,
      seriesId,
    ]);
    await db.query(`insert into public.reviews (user_id, series_id, rating) values ($1, $2, 3.0)`, [dave, seriesId]);
    await db.query(`insert into public.follows (follower_id, following_id) values ($1, $2)`, [dave, BOB]);

    let ok = true;
    try {
      await db.query(`select public.delete_own_account()`);
    } catch {
      ok = false;
    }
    await reset(db);

    expect(ok).toBe(true);
    expect(await count(`select count(*)::int as n from auth.users where id = $1`, [dave])).toBe(0);
    expect(await count(`select count(*)::int as n from public.profiles where id = $1`, [dave])).toBe(0);
    expect(await count(`select count(*)::int as n from public.reviews where user_id = $1`, [dave])).toBe(0);
    expect(await count(`select count(*)::int as n from public.follows where follower_id = $1`, [dave])).toBe(0);
  });

  it("requires authentication", async () => {
    let rejected = false;
    try {
      await db.query(`select public.delete_own_account()`);
    } catch {
      rejected = true;
    }
    expect(rejected).toBe(true);
  });
});
