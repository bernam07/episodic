# Episodic — Database Setup

> This document is the setup recipe for a fresh Supabase project.

## Prerequisites

- A Supabase project (https://supabase.com/dashboard)
- A TMDB API key (https://www.themoviedb.org/settings/api). Either credential works — the Edge Function detects which one you gave it and authenticates accordingly:
  - **v3 API key** (32 hex chars) — sent as an `api_key` query parameter
  - **v4 API Read Access Token** (a long JWT) — sent as a `Bearer` header
- Supabase CLI (already installed: `supabase --version`)

## Step 1 — Link the CLI to your project

Grab your project ref from the dashboard URL (`https://supabase.com/dashboard/project/<PROJECT_REF>`).

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
```

You will be prompted for the database password you set when creating the project.

## Step 2 — Push the migrations

```bash
supabase db push
```

This applies, in order:

| Migration | Contents |
|---|---|
| `20260716120000_init_schema.sql` | `series_watch_status` enum, 5 tables, indexes |
| `20260716120100_functions_triggers.sql` | `updated_at` triggers, auto profile creation, auto status sync |
| `20260716120200_rls_policies.sql` | Row Level Security on every table |
| `20260716120300_views_rpcs.sql` | `user_series_progress` view + 4 RPCs |

Verify:

```bash
supabase db diff
```

An empty diff means local migrations and the remote database match.

## Step 3 — Configure the TMDB secret

The TMDB token is server-side only. It never reaches the browser bundle.

```bash
supabase secrets set TMDB_ACCESS_TOKEN=<your_tmdb_read_access_token>
```

## Step 4 — Deploy the TMDB Edge Function

```bash
supabase functions deploy tmdb
```

The function requires a valid Supabase JWT (`verify_jwt = true`), so only signed-in users can reach TMDB through it.

Available routes:

| Route | Purpose |
|---|---|
| `GET /tmdb/search?q=<query>&page=1` | Search series |
| `GET /tmdb/trending?page=1` | Trending this week |
| `GET /tmdb/series/:tmdbId` | Series detail incl. `seasons_meta` |
| `GET /tmdb/series/:tmdbId/season/:n` | Episodes of one season |

## Step 5 — Configure Auth

Auth settings are declared in `supabase/config.toml` and pushed to the project — no dashboard clicking required:

```bash
supabase config push
```

This applies the `[auth]` block: email signup enabled, `enable_confirmations = false` (so signup returns a session immediately instead of requiring an inbox round-trip), and Site URL `http://localhost:5173`.

Re-enable confirmations before you ever expose this app publicly.

`[storage.vector]` is explicitly disabled in the config: the CLI defaults it to enabled, and pushing that to a free-tier project fails with `402 Please upgrade the project to a paid tier`.

## Step 6 — Frontend environment variables

```bash
cp .env.example .env.local
```

Fill in from **Project Settings → API**:

- `VITE_SUPABASE_URL` — your project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the publishable (anon) key

The publishable key is safe in the client; RLS is what protects the data. The **secret key must never** be placed in a `VITE_*` variable — anything prefixed `VITE_` is inlined into the public bundle.

## Step 7 — Smoke test

In the dashboard SQL editor:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';
```

Every row must show `rowsecurity = true`.

Then sign up a user in your app and confirm a matching row appears in `public.profiles` — that proves the `on_auth_user_created` trigger fired.

## Data model notes

**Why there is no `episodes` table.** TMDB returns a full season in one CDN-backed request, and TanStack Query caches it client-side. Mirroring episode content into Postgres would add write amplification and staleness for no gain. What Postgres *does* store is the episode **counts** (`series.seasons_meta`), because rendering progress bars across a whole library must not require N TMDB calls. Counts live locally, content streams from TMDB.

**Automatic status transitions.** A trigger on `episode_tracking` keeps `user_series_status` honest:

- First check-in on an untracked series creates the status as `watching`
- Watching the final remaining episode flips status to `watched` and stamps `completed_at`
- Un-checking an episode reverts `watched` back to `watching`
- `abandoned` is never overridden automatically — only the user can leave that state

**No Postgres extensions.** Primary keys use `gen_random_uuid()`, which is core Postgres since v13. Supabase installs `uuid-ossp` into the `extensions` schema, which is not on the search path during migrations, so `uuid_generate_v4()` fails to resolve with `42883`. Avoiding the extension avoids the whole class of problem — do not reintroduce one without schema-qualifying it.

**Verification.** The migrations were behaviour-tested against Postgres (via PGlite) before being pushed — 32 checks covering the auth trigger, username collisions, upsert idempotency, progress math, status transitions, review constraints, and cross-user RLS isolation. They were then re-verified against the live project end-to-end: signup → profile trigger → TMDB function → series cache → season check-in → progress → review, plus confirmation that anonymous reads return nothing.
