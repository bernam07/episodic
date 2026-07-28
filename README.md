# Episodic

[![CI](https://github.com/bernam07/episodic/actions/workflows/ci.yml/badge.svg)](https://github.com/bernam07/episodic/actions/workflows/ci.yml)

A Letterboxd for television. Track the series you watch, check off episodes, rate what you
finish, and follow what your friends are watching. An installable PWA, built mobile-first for
iPhone and fully usable on desktop.

> This is a personal project. The repository is public to show the work, but it isn't meant to be
> cloned and stood up elsewhere — the live instance runs against its own Supabase project and TMDB
> credentials that stay private.

## Features

- **Discover** — a trending hero, endless genre-filtered browsing, TMDB search, and "more like this" recommendations.
- **Track** — four lists (Want to Watch, Watching, Watched, Abandoned), per-episode check-ins, season progress bars, one-tap **Up Next**, a **rewatch** counter, and **favorites**.
- **Know where you stand** — "up to date", "3 episodes behind", or "you finished this", each with the next air date, plus a **calendar** of upcoming episodes for your lists.
- **Rate & review** — half-star ratings (decoupled from reviews, so rating stays silent), and spoiler-tagged reviews you can edit or delete.
- **Social** — follow people, watch a chronological **activity feed** of what they start, finish and review, browse per-profile **diaries**, **compare libraries**, and build public or private **lists**.
- **Insights** — a stats page with total watch time, a library breakdown, top genres, and a ratings histogram.
- **Share** — generate a Letterboxd-style **9:16 share card** (poster, rating, handle) sized for an Instagram story.
- **Notifications** — an in-app bell plus **Web Push** for new followers, reviews from people you follow, and newly-aired episodes of series you're watching.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript 7 (native `tsgo`) + Vite 8 |
| Styling | Tailwind CSS 4 (CSS-first theme, dark blue) |
| Server state | TanStack Query 5 |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| TV data | TMDB, proxied through a Supabase Edge Function |
| PWA | vite-plugin-pwa (Workbox) with Web Push |
| Lint | oxlint (parses TS itself — no `typescript-eslint`, which can't run on `tsgo`) |

## Architecture

Clean Architecture with dependencies pointing inward. `domain` knows nothing about React or
Supabase; the UI never reaches for a concrete implementation.

```
src/
├── core/                 Framework-agnostic primitives (env, errors)
├── domain/               Business rules — zero external dependencies
│   ├── entities/         Types and pure functions (watch-state, rating validity, aired-yet)
│   ├── repositories/     Interfaces the domain requires
│   └── usecases/         Orchestration and validation
├── data/                 Implementations of the domain interfaces
│   ├── supabase/         Postgres + Auth + Storage
│   └── tmdb/             Edge Function client and image URL helpers
├── presentation/         React
│   ├── di/container.ts   Composition root — the only place wiring happens
│   ├── hooks/            TanStack Query wrappers over use cases
│   ├── components/       Reusable UI
│   ├── layout/           App shell, bottom nav, safe areas
│   ├── router/           Routes and the auth guard
│   └── screens/          One folder per screen
└── types/                Generated Supabase types
```

The UI calls hooks, which call use cases, which depend on interfaces; `container.ts` is the single
place the concrete Supabase and TMDB implementations get bound. These boundaries aren't just a
convention — oxlint enforces them with `no-restricted-imports`, so a stray `data/supabase` import
from the UI fails the build.

## Design decisions

**There is no `episodes` table, by design.** TMDB serves a full season in one CDN-backed call and
TanStack Query caches it client-side, so mirroring episode content into Postgres would only add
staleness. What Postgres stores is episode *counts* (`series.seasons_meta`), because progress bars
across a whole library must not cost N TMDB calls. The `user_series_progress` view renders the
entire Library screen in one query with zero TMDB requests.

**Status transitions are automatic.** A trigger on `episode_tracking` moves a series to `watching`
on the first check-in and to `watched` when the last episode is checked off, reversing if you
un-check. `abandoned` is never overridden automatically. Marking a series "Watched" backfills every
aired episode from TMDB (unaired episodes of a returning series are left alone), writing the
episodes *before* the status so an explicit choice always wins over the trigger.

**"Up to date" and "finished" are different states.** `describeWatchState` in
`domain/entities/Airing.ts` distinguishes them: a returning series with every aired episode watched
is *up to date* (and shows the next air date), while only an ended series with everything watched is
*finished*. Aired counts derive from TMDB's `last_episode_to_air` combined with `seasons_meta`.

**Activity feeds are built from milestones, not raw rows.** Adding a series you watched a year ago
backfills hundreds of check-ins all stamped `now()`; the feed engine collapses that noise into
"started", "finished", "reviewed", and one grouped "watched N episodes of X" per day, so a binge-add
reads as a single line.

## Privacy model

**Libraries are visible only to people you follow.** Enforced in Postgres, not the UI:

```sql
using (
  auth.uid() = user_id
  or exists (select 1 from follows f
             where f.follower_id = auth.uid() and f.following_id = user_series_status.user_id)
)
```

Unfollowing revokes access immediately. Aggregate counts (series, episodes, reviews) are public via
`security definer` RPCs, matching how Letterboxd shows profile stats; episode-level check-ins stay
private to their owner.

**Username login never exposes emails.** Signing in with a username needs a username-to-email
lookup. Doing that with a database RPC would leak every user's email to anyone who can guess a
username, so it happens inside the `auth-login` Edge Function using the service role — the browser
only ever receives tokens. The function returns an identical `invalid_credentials` error for an
unknown username and a wrong password alike, so it can't be used to enumerate accounts.

**Usernames are claimed atomically.** The signup trigger raises on a duplicate, and because it runs
inside the signup transaction the auth user rolls back too — no orphaned account.

## Responsive behaviour

The app targets iPhone first but is fully usable on tablet and desktop.

| Breakpoint | Navigation | Poster grid |
|---|---|---|
| `< 640px` (phone) | Fixed bottom bar | 3 columns |
| `640–767px` | Fixed bottom bar | 4 columns |
| `≥ 768px` (tablet/desktop) | Left sidebar | 5–6 columns |

Modals render as bottom sheets on phones and centered dialogs from `md` up. iPhone specifics:
`viewport-fit=cover` with `env(safe-area-inset-*)` so the Dynamic Island and home indicator never
cover content; 16px input fonts so Safari doesn't zoom on focus; hidden scrollbars with `:active`
feedback instead of tap highlights; and `overscroll-behavior-y: none` to suppress rubber-banding in
standalone mode.

## Testing & quality

Nothing here ships on assumption:

- **Domain** — Vitest units over the pure logic (watch-state, rating/username/email validators) and the `SetSeriesStatus` orchestration with fake repositories.
- **Schema** — RLS, RPC, trigger, and privacy behaviour checked against real Postgres compiled to WebAssembly (PGlite): follow-gating, status transitions, the activity feed's collapse rules, cascade deletion, and more — no live backend, so it runs in CI.
- **Lint** — oxlint enforces the Clean Architecture import boundaries and accessibility rules.
- **CI** — typecheck → lint → test → build on every push and pull request.

## License

MIT — see [LICENSE](LICENSE).
