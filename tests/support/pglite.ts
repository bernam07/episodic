import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

const SHIM = `
create schema if not exists auth;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid
);
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select string_to_array(name, '/');
$$;
grant usage on schema storage to anon, authenticated, service_role;
`;

const GRANTS = `
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
revoke insert, update, delete on public.series from authenticated;
`;

export async function createMigratedDb(): Promise<PGlite> {
  const db = await PGlite.create();
  await db.exec(SHIM);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    try {
      await db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
    } catch (error) {
      throw new Error(`migration ${file} failed: ${(error as Error).message}`);
    }
  }

  await db.exec(GRANTS);
  return db;
}

export async function asUser(db: PGlite, id: string): Promise<void> {
  await db.exec(`set request.jwt.claim.sub = '${id}';`);
}

export async function asAuthenticated(db: PGlite, id: string): Promise<void> {
  await db.exec(`set role authenticated;`);
  await asUser(db, id);
}

export async function reset(db: PGlite): Promise<void> {
  await db.exec(`reset role;`);
  await db.exec(`select set_config('request.jwt.claim.sub', '', false);`);
}

export async function createAuthUser(
  db: PGlite,
  id: string,
  username: string,
  displayName?: string
): Promise<void> {
  const meta: Record<string, string> = { username };
  if (displayName) {
    meta.display_name = displayName;
  }
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)`, [
    id,
    `${username}@example.com`,
    JSON.stringify(meta),
  ]);
}

export const BREAKING_BAD = {
  tmdb_id: 1396,
  name: "Breaking Bad",
  number_of_seasons: 1,
  number_of_episodes: 7,
  genres: ["Drama"],
  seasons_meta: [{ season_number: 1, episode_count: 7 }],
};
