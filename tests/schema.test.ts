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
    await db.query(`insert into public.reviews (user_id, series_id, rating, body) values ($1, $2, 4.5, 'Great show')`, [
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

describe("get_up_next", () => {
  const EDDIE = "55555555-5555-5555-5555-555555555555";
  let seriesId: string;

  const PAYLOAD = {
    tmdb_id: 9999,
    name: "Test Show",
    number_of_seasons: 2,
    number_of_episodes: 6,
    aired_episodes: 5,
    genres: ["Drama"],
    seasons_meta: [
      { season_number: 1, episode_count: 3 },
      { season_number: 2, episode_count: 3 },
    ],
  };

  async function watch(season: number, episode: number, epId: number) {
    await db.query(
      `insert into public.episode_tracking (user_id, series_id, tmdb_episode_id, season_number, episode_number)
       values ($1, $2, $3, $4, $5) on conflict (user_id, tmdb_episode_id) do nothing`,
      [EDDIE, seriesId, epId, season, episode]
    );
  }

  async function upNext() {
    await asAuthenticated(db, EDDIE);
    const r = await db.query<{ next_season: number; next_episode: number; tmdb_id: number }>(
      `select next_season, next_episode, tmdb_id from public.get_up_next(20)`
    );
    await reset(db);
    return r.rows;
  }

  beforeAll(async () => {
    await createAuthUser(db, EDDIE, "eddie");
    await asAuthenticated(db, EDDIE);
    const r = await db.query<{ id: string }>(`select public.upsert_series_from_tmdb($1::jsonb) as id;`, [
      JSON.stringify(PAYLOAD),
    ]);
    seriesId = r.rows[0].id;
    await db.query(
      `insert into public.user_series_status (user_id, series_id, status) values ($1, $2, 'watching')`,
      [EDDIE, seriesId]
    );
    await reset(db);
  });

  it("suggests the next episode in order after the last watched", async () => {
    await asAuthenticated(db, EDDIE);
    await watch(1, 1, 1001);
    await watch(1, 2, 1002);
    await reset(db);
    const rows = await upNext();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ next_season: 1, next_episode: 3 });
  });

  it("counts out-of-order watching per season (client resolves the exact gap)", async () => {
    await asAuthenticated(db, EDDIE);
    await db.query(`delete from public.episode_tracking where user_id = $1`, [EDDIE]);
    await watch(1, 1, 1001);
    await watch(1, 3, 1003);
    await reset(db);
    const rows = await upNext();
    expect(rows[0]).toMatchObject({ next_season: 1, next_episode: 3 });
  });

  it("survives absolute episode numbering inside a season (One Piece-style)", async () => {
    await asAuthenticated(db, EDDIE);
    await db.query(`delete from public.episode_tracking where user_id = $1`, [EDDIE]);
    await watch(1, 1, 1001);
    await watch(1, 2, 1002);
    await watch(1, 3, 1003);
    await watch(2, 62, 2062);
    await reset(db);
    const rows = await upNext();
    expect(rows[0]).toMatchObject({ next_season: 2, next_episode: 2 });
  });

  it("crosses into the next season", async () => {
    await asAuthenticated(db, EDDIE);
    await db.query(`delete from public.episode_tracking where user_id = $1`, [EDDIE]);
    await watch(1, 1, 1001);
    await watch(1, 2, 1002);
    await watch(1, 3, 1003);
    await reset(db);
    const rows = await upNext();
    expect(rows[0]).toMatchObject({ next_season: 2, next_episode: 1 });
  });

  it("never suggests an unaired episode (up to date once all aired are watched)", async () => {
    await asAuthenticated(db, EDDIE);
    await db.query(`delete from public.episode_tracking where user_id = $1`, [EDDIE]);
    await watch(1, 1, 1001);
    await watch(1, 2, 1002);
    await watch(1, 3, 1003);
    await watch(2, 1, 2001);
    await watch(2, 2, 2002);
    await reset(db);
    const rows = await upNext();
    expect(rows).toHaveLength(0);
  });

  it("only includes another user's series when they are watching it, scoped per viewer", async () => {
    await asAuthenticated(db, BOB);
    const rows = await db.query(`select * from public.get_up_next(20)`);
    await reset(db);
    expect(rows.rows.every((r: { tmdb_id: number }) => r.tmdb_id !== 9999)).toBe(true);
  });
});

describe("activity feed", () => {
  const FRANK = "66666666-6666-6666-6666-666666666666";
  const GRETA = "77777777-7777-7777-7777-777777777777";
  let seriesId: string;

  const SHOW = {
    tmdb_id: 8888,
    name: "Diary Show",
    number_of_seasons: 1,
    number_of_episodes: 4,
    aired_episodes: 4,
    genres: ["Drama"],
    seasons_meta: [{ season_number: 1, episode_count: 4 }],
  };

  type Event = {
    event_type: string;
    actor_id: string;
    episode_count: number | null;
    rating: string | null;
  };

  async function watchOn(user: string, epId: number, episode: number, day: string) {
    await db.query(
      `insert into public.episode_tracking (user_id, series_id, tmdb_episode_id, season_number, episode_number, watched_at)
       values ($1, $2, $3, 1, $4, $5) on conflict (user_id, tmdb_episode_id) do nothing`,
      [user, seriesId, epId, episode, day]
    );
  }

  async function feed(viewer: string): Promise<Event[]> {
    await asAuthenticated(db, viewer);
    const r = await db.query<Event>(
      `select event_type, actor_id, episode_count, rating from public.get_friends_feed(50)`
    );
    await reset(db);
    return r.rows;
  }

  async function diary(viewer: string, target: string): Promise<Event[]> {
    await asAuthenticated(db, viewer);
    const r = await db.query<Event>(
      `select event_type, actor_id, episode_count, rating from public.get_user_diary($1, 50)`,
      [target]
    );
    await reset(db);
    return r.rows;
  }

  beforeAll(async () => {
    await db.exec(`delete from public.follows;`);
    await createAuthUser(db, FRANK, "frank");
    await createAuthUser(db, GRETA, "greta");
    await asAuthenticated(db, GRETA);
    const r = await db.query<{ id: string }>(`select public.upsert_series_from_tmdb($1::jsonb) as id;`, [
      JSON.stringify(SHOW),
    ]);
    seriesId = r.rows[0].id;
    await reset(db);
    await db.query(`insert into public.follows (follower_id, following_id) values ($1, $2)`, [FRANK, GRETA]);
  });

  afterEach(async () => {
    await db.exec(
      `delete from public.episode_tracking where series_id = '${seriesId}';
       delete from public.reviews where series_id = '${seriesId}';
       delete from public.user_series_status where series_id = '${seriesId}';`
    );
  });

  it("collapses same-day check-ins into one progress event carrying the count", async () => {
    await asAuthenticated(db, GRETA);
    await watchOn(GRETA, 8001, 1, "2026-07-10T10:00:00Z");
    await watchOn(GRETA, 8002, 2, "2026-07-10T11:00:00Z");
    await watchOn(GRETA, 8003, 3, "2026-07-10T12:00:00Z");
    await reset(db);

    const progress = (await feed(FRANK)).filter((e) => e.event_type === "progress");
    expect(progress).toHaveLength(1);
    expect(progress[0].episode_count).toBe(3);
  });

  it("suppresses progress and started on the day a backfill marks a series finished", async () => {
    await asAuthenticated(db, GRETA);
    await watchOn(GRETA, 8001, 1, "2026-07-11T10:00:00Z");
    await watchOn(GRETA, 8002, 2, "2026-07-11T10:01:00Z");
    await watchOn(GRETA, 8003, 3, "2026-07-11T10:02:00Z");
    await watchOn(GRETA, 8004, 4, "2026-07-11T10:03:00Z");
    await reset(db);
    await db.query(
      `update public.user_series_status
         set status = 'watched', started_at = '2026-07-11T08:00:00Z', completed_at = '2026-07-11T12:00:00Z'
       where user_id = $1 and series_id = $2`,
      [GRETA, seriesId]
    );

    const rows = await feed(FRANK);
    expect(rows.filter((e) => e.event_type === "progress")).toHaveLength(0);
    expect(rows.filter((e) => e.event_type === "started")).toHaveLength(0);
    expect(rows.filter((e) => e.event_type === "finished")).toHaveLength(1);
  });

  it("surfaces a written review but keeps a bare rating silent", async () => {
    await db.query(
      `insert into public.user_series_status (user_id, series_id, status, rating) values ($1, $2, 'watching', 4.5)
       on conflict (user_id, series_id) do update set rating = 4.5`,
      [GRETA, seriesId]
    );
    expect((await feed(FRANK)).filter((e) => e.event_type === "reviewed")).toHaveLength(0);

    await db.query(`insert into public.reviews (user_id, series_id, body) values ($1, $2, 'Great')`, [GRETA, seriesId]);
    expect((await feed(FRANK)).filter((e) => e.event_type === "reviewed")).toHaveLength(1);
  });

  it("friends feed shows followed users' events but never the viewer's own", async () => {
    await asAuthenticated(db, GRETA);
    await watchOn(GRETA, 8001, 1, "2026-07-12T10:00:00Z");
    await reset(db);
    await asAuthenticated(db, FRANK);
    await watchOn(FRANK, 8101, 1, "2026-07-12T10:00:00Z");
    await reset(db);

    const rows = await feed(FRANK);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((e) => e.actor_id === GRETA)).toBe(true);
  });

  it("diary is visible to the owner and followers, hidden from everyone else", async () => {
    await asAuthenticated(db, GRETA);
    await watchOn(GRETA, 8001, 1, "2026-07-13T10:00:00Z");
    await reset(db);

    expect((await diary(GRETA, GRETA)).length).toBeGreaterThan(0);
    expect((await diary(FRANK, GRETA)).length).toBeGreaterThan(0);
    expect(await diary(CAROL, GRETA)).toHaveLength(0);
  });
});

describe("community rating summary", () => {
  let seriesId: string;

  beforeAll(async () => {
    await asAuthenticated(db, ALICE);
    const r = await db.query<{ id: string }>(`select public.upsert_series_from_tmdb($1::jsonb) as id;`, [
      JSON.stringify({ ...BREAKING_BAD, tmdb_id: 7777, name: "Rated Show" }),
    ]);
    seriesId = r.rows[0].id;
    await reset(db);
  });

  it("groups reviews into rating buckets", async () => {
    await asAuthenticated(db, ALICE);
    await db.query(
      `insert into public.user_series_status (user_id, series_id, status, rating)
       values ($1, $2, 'watching', 4.5)
       on conflict (user_id, series_id) do update set rating = 4.5`,
      [ALICE, seriesId]
    );
    await reset(db);
    await asAuthenticated(db, BOB);
    await db.query(
      `insert into public.user_series_status (user_id, series_id, status, rating)
       values ($1, $2, 'watching', 4.5)
       on conflict (user_id, series_id) do update set rating = 4.5`,
      [BOB, seriesId]
    );
    await reset(db);
    await asAuthenticated(db, CAROL);
    await db.query(
      `insert into public.user_series_status (user_id, series_id, status, rating)
       values ($1, $2, 'watching', 3.0)
       on conflict (user_id, series_id) do update set rating = 3.0`,
      [CAROL, seriesId]
    );

    const r = await db.query<{ rating: number; count: number }>(
      `select rating, count from public.get_series_rating_summary($1) order by rating`,
      [seriesId]
    );
    await reset(db);

    expect(r.rows.map((row) => ({ rating: Number(row.rating), count: row.count }))).toEqual([
      { rating: 3, count: 1 },
      { rating: 4.5, count: 2 },
    ]);
  });
});

describe("get_user_favorites", () => {
  let seriesId: string;

  beforeAll(async () => {
    await db.exec(`delete from public.follows;`);
    seriesId = await seedSeries();
    await asAuthenticated(db, ALICE);
    await db.query(
      `insert into public.user_series_status (user_id, series_id, status, is_favorite)
       values ($1, $2, 'watching', true)
       on conflict (user_id, series_id) do update set is_favorite = true`,
      [ALICE, seriesId]
    );
    await reset(db);
    await db.query(`insert into public.follows (follower_id, following_id) values ($1, $2)`, [BOB, ALICE]);
  });

  it("returns favorites to followers and hides them from strangers", async () => {
    await asAuthenticated(db, BOB);
    const asFollower = await db.query(`select series_id from public.get_user_favorites($1, 60)`, [ALICE]);
    await reset(db);

    await asAuthenticated(db, CAROL);
    const asStranger = await db.query(`select series_id from public.get_user_favorites($1, 60)`, [ALICE]);
    await reset(db);

    expect(asFollower.rows).toHaveLength(1);
    expect(asStranger.rows).toHaveLength(0);
  });
});

describe("lists", () => {
  let seriesId: string;
  let publicList: string;
  let privateList: string;

  beforeAll(async () => {
    seriesId = await seedSeries();
    await asAuthenticated(db, ALICE);
    const pub = await db.query<{ id: string }>(
      `insert into public.lists (user_id, title, is_private) values ($1, 'Best sci-fi', false) returning id`,
      [ALICE]
    );
    publicList = pub.rows[0].id;
    const priv = await db.query<{ id: string }>(
      `insert into public.lists (user_id, title, is_private) values ($1, 'Guilty pleasures', true) returning id`,
      [ALICE]
    );
    privateList = priv.rows[0].id;
    await db.query(`insert into public.list_items (list_id, series_id) values ($1, $2)`, [publicList, seriesId]);
    await reset(db);
  });

  it("exposes item count and posters to the owner", async () => {
    await asAuthenticated(db, ALICE);
    const r = await db.query<{ id: string; item_count: number; poster_paths: string[] }>(
      `select id, item_count, poster_paths from public.get_user_lists($1)`,
      [ALICE]
    );
    await reset(db);
    expect(r.rows).toHaveLength(2);
    expect(r.rows.find((row) => row.id === publicList)?.item_count).toBe(1);
  });

  it("hides private lists from other viewers", async () => {
    await asAuthenticated(db, BOB);
    const lists = await db.query<{ id: string }>(`select id from public.get_user_lists($1)`, [ALICE]);
    const one = await db.query(`select id from public.get_list($1)`, [privateList]);
    await reset(db);
    expect(lists.rows.map((row) => row.id)).toEqual([publicList]);
    expect(one.rows).toHaveLength(0);
  });

  it("lets non-owners read a public list and its items", async () => {
    await asAuthenticated(db, BOB);
    const meta = await db.query(`select id, is_own from public.get_list($1)`, [publicList]);
    const items = await db.query(`select series_id from public.get_list_items($1)`, [publicList]);
    await reset(db);
    expect(meta.rows).toHaveLength(1);
    expect((meta.rows[0] as { is_own: boolean }).is_own).toBe(false);
    expect(items.rows).toHaveLength(1);
  });

  it("forbids adding items to someone else's list", async () => {
    await asAuthenticated(db, BOB);
    let rejected = false;
    try {
      await db.query(`insert into public.list_items (list_id, series_id) values ($1, $2)`, [privateList, seriesId]);
    } catch {
      rejected = true;
    }
    await reset(db);
    expect(rejected).toBe(true);
  });
});

describe("bump_rewatch", () => {
  let seriesId: string;

  beforeAll(async () => {
    seriesId = await seedSeries();
    await asAuthenticated(db, CAROL);
    await db.query(
      `insert into public.user_series_status (user_id, series_id, status) values ($1, $2, 'watched')
       on conflict (user_id, series_id) do update set status = 'watched'`,
      [CAROL, seriesId]
    );
    await reset(db);
  });

  it("increments and clamps the rewatch count at zero", async () => {
    await asAuthenticated(db, CAROL);
    const up = await db.query<{ bump_rewatch: number }>(`select public.bump_rewatch($1, 1)`, [seriesId]);
    const up2 = await db.query<{ bump_rewatch: number }>(`select public.bump_rewatch($1, 1)`, [seriesId]);
    const down = await db.query<{ bump_rewatch: number }>(`select public.bump_rewatch($1, -5)`, [seriesId]);
    await reset(db);

    expect(up.rows[0].bump_rewatch).toBe(1);
    expect(up2.rows[0].bump_rewatch).toBe(2);
    expect(down.rows[0].bump_rewatch).toBe(0);
  });

  it("surfaces the count through the progress view", async () => {
    await asAuthenticated(db, CAROL);
    await db.query(`select public.bump_rewatch($1, 3)`, [seriesId]);
    const r = await db.query<{ rewatch_count: number }>(
      `select rewatch_count from public.user_series_progress where series_id = $1`,
      [seriesId]
    );
    await reset(db);
    expect(r.rows[0].rewatch_count).toBe(3);
  });
});

describe("push subscriptions", () => {
  it("keeps a subscription visible only to its owner", async () => {
    await asAuthenticated(db, ALICE);
    await db.query(
      `insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
       values ($1, 'https://push.example/alice', 'p', 'a')`,
      [ALICE]
    );
    const own = await db.query(`select count(*)::int as n from public.push_subscriptions`);
    await reset(db);

    await asAuthenticated(db, BOB);
    const other = await db.query(`select count(*)::int as n from public.push_subscriptions`);
    await reset(db);

    expect((own.rows[0] as { n: number }).n).toBe(1);
    expect((other.rows[0] as { n: number }).n).toBe(0);
  });
});

describe("compare_libraries", () => {
  let s1: string;
  let s2: string;

  async function seed(tmdbId: number, name: string): Promise<string> {
    await asAuthenticated(db, ALICE);
    const r = await db.query<{ id: string }>(`select public.upsert_series_from_tmdb($1::jsonb) as id`, [
      JSON.stringify({ ...BREAKING_BAD, tmdb_id: tmdbId, name }),
    ]);
    await reset(db);
    return r.rows[0].id;
  }

  beforeAll(async () => {
    await db.exec(`delete from public.follows;`);
    s1 = await seed(6001, "Shared Show");
    s2 = await seed(6002, "Bob Only");
    await db.query(`insert into public.follows (follower_id, following_id) values ($1, $2)`, [ALICE, BOB]);
    await db.query(
      `insert into public.user_series_status (user_id, series_id, status, rating) values ($1, $2, 'watching', 4.0)
       on conflict (user_id, series_id) do update set status = 'watching', rating = 4.0`,
      [ALICE, s1]
    );
    await db.query(
      `insert into public.user_series_status (user_id, series_id, status, rating) values ($1, $2, 'watched', 5.0)
       on conflict (user_id, series_id) do update set status = 'watched', rating = 5.0`,
      [BOB, s1]
    );
    await db.query(
      `insert into public.user_series_status (user_id, series_id, status) values ($1, $2, 'watching')
       on conflict (user_id, series_id) do update set status = 'watching'`,
      [BOB, s2]
    );
  });

  it("returns the union of both libraries with each side's status and rating", async () => {
    await asAuthenticated(db, ALICE);
    const r = await db.query<{
      tmdb_id: number;
      my_status: string | null;
      my_rating: string | null;
      their_status: string | null;
      their_rating: string | null;
    }>(
      `select tmdb_id, my_status, my_rating, their_status, their_rating from public.compare_libraries($1) order by tmdb_id`,
      [BOB]
    );
    await reset(db);

    const byId = new Map(r.rows.map((row) => [row.tmdb_id, row]));
    expect(byId.get(6001)).toMatchObject({ my_status: "watching", their_status: "watched" });
    expect(Number(byId.get(6001)!.my_rating)).toBe(4);
    expect(Number(byId.get(6001)!.their_rating)).toBe(5);
    expect(byId.get(6002)).toMatchObject({ my_status: null, their_status: "watching" });
  });

  it("refuses to compare with a user you don't follow", async () => {
    await asAuthenticated(db, CAROL);
    let rejected = false;
    try {
      await db.query(`select * from public.compare_libraries($1)`, [BOB]);
    } catch {
      rejected = true;
    }
    await reset(db);
    expect(rejected).toBe(true);
  });
});

describe("set_rating and review sync", () => {
  let seriesId: string;

  beforeAll(async () => {
    await asAuthenticated(db, ALICE);
    const r = await db.query<{ id: string }>(`select public.upsert_series_from_tmdb($1::jsonb) as id`, [
      JSON.stringify({ ...BREAKING_BAD, tmdb_id: 6003, name: "Rating Sync Show" }),
    ]);
    seriesId = r.rows[0].id;
    await db.query(`insert into public.user_series_status (user_id, series_id, status) values ($1, $2, 'watching')`, [
      ALICE,
      seriesId,
    ]);
    await reset(db);
  });

  afterEach(async () => {
    await db.exec(`delete from public.reviews where series_id = '${seriesId}';`);
  });

  it("writes the rating onto the status row and the progress view", async () => {
    await asAuthenticated(db, ALICE);
    await db.query(`select public.set_rating($1, 4.5)`, [seriesId]);
    const r = await db.query<{ user_rating: string }>(
      `select user_rating from public.user_series_progress where user_id = $1 and series_id = $2`,
      [ALICE, seriesId]
    );
    await reset(db);
    expect(Number(r.rows[0].user_rating)).toBe(4.5);
  });

  it("refuses to rate a series not in the library", async () => {
    await asAuthenticated(db, BOB);
    let rejected = false;
    try {
      await db.query(`select public.set_rating($1, 3.0)`, [seriesId]);
    } catch {
      rejected = true;
    }
    await reset(db);
    expect(rejected).toBe(true);
  });

  it("back-fills a new review's rating from the status rating", async () => {
    await asAuthenticated(db, ALICE);
    await db.query(`select public.set_rating($1, 4.0)`, [seriesId]);
    await db.query(`insert into public.reviews (user_id, series_id, body) values ($1, $2, 'Great show')`, [
      ALICE,
      seriesId,
    ]);
    const r = await db.query<{ rating: string | null }>(
      `select rating from public.reviews where user_id = $1 and series_id = $2`,
      [ALICE, seriesId]
    );
    await reset(db);
    expect(Number(r.rows[0].rating)).toBe(4);
  });

  it("syncs a later rating change onto an existing review", async () => {
    await asAuthenticated(db, ALICE);
    await db.query(`select public.set_rating($1, 4.0)`, [seriesId]);
    await db.query(`insert into public.reviews (user_id, series_id, body) values ($1, $2, 'Great')`, [ALICE, seriesId]);
    await db.query(`select public.set_rating($1, 2.5)`, [seriesId]);
    const r = await db.query<{ rating: string }>(
      `select rating from public.reviews where user_id = $1 and series_id = $2`,
      [ALICE, seriesId]
    );
    await reset(db);
    expect(Number(r.rows[0].rating)).toBe(2.5);
  });
});

describe("new_episode notifications", () => {
  it("delivers a system notification with no actor and the episode number", async () => {
    const seriesId = await seedSeries();
    await db.query(
      `insert into public.notifications (user_id, type, series_id, season_number, episode_number)
       values ($1, 'new_episode', $2, 2, 5)`,
      [ALICE, seriesId]
    );

    await asAuthenticated(db, ALICE);
    const r = await db.query<{
      type: string;
      actor_id: string | null;
      season_number: number;
      episode_number: number;
      series_name: string | null;
    }>(
      `select type, actor_id, season_number, episode_number, series_name
       from public.get_notifications(50) where type = 'new_episode'`
    );
    await reset(db);

    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ type: "new_episode", actor_id: null, season_number: 2, episode_number: 5 });
    expect(r.rows[0].series_name).toBeTruthy();
  });
});
