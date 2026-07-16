# Episodic

A Letterboxd for television. Track series, check off episodes, rate what you finish,
and follow what your friends are watching. A PWA built mobile-first for iPhone,
installable to the home screen, and fully usable on desktop.

## Features

- **Discover** — endless browse feed with genre filters, trending hero, TMDB search
- **Track** — four lists (Want to Watch, Watching, Watched, Abandoned), per-episode check-ins, season progress bars
- **Know where you stand** — "up to date", "3 episodes behind", "you finished this series", with next air dates
- **Rate & review** — half-star ratings, spoiler-tagged reviews, editable and deletable
- **Social** — search people, follow them, and see a feed of what they add, rate and finish

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript 7 + Vite 8 |
| Styling | Tailwind CSS 4 (CSS-first theme, dark blue) |
| Server state | TanStack Query 5 |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| TV data | TMDB, proxied through a Supabase Edge Function |
| PWA | vite-plugin-pwa (Workbox) |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm run dev
```

Database and Edge Function setup lives in [docs/DATABASE.md](docs/DATABASE.md).

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server on http://localhost:5173 |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Serve the production build (needed to exercise the service worker) |
| `npm run typecheck` | Types only |

The service worker is disabled in dev. To test installability and offline behaviour, use `npm run build && npm run preview`.

## Architecture

Clean Architecture with dependencies pointing inward. `domain` knows nothing about React or Supabase; swapping the backend means rewriting `data` and nothing else.

```
src/
├── core/                 Framework-agnostic primitives (env, errors)
├── domain/               Business rules — zero external dependencies
│   ├── entities/         Types and pure functions (rating validity, aired-yet)
│   ├── repositories/     Interfaces the domain requires
│   └── usecases/         Orchestration and validation
├── data/                 Implementations of the domain interfaces
│   ├── supabase/         Postgres + Auth
│   └── tmdb/             Edge Function client and image URL helpers
├── presentation/         React
│   ├── di/container.ts   Composition root — the only place wiring happens
│   ├── hooks/            TanStack Query wrappers over use cases
│   ├── components/       Reusable UI
│   ├── layout/           App shell, bottom nav, safe areas
│   ├── router/           Routes and the auth guard
│   └── screens/          One folder per screen
└── types/                Generated Supabase types (do not edit by hand)
```

The UI never imports from `data/supabase`. It calls hooks, which call use cases, which depend on interfaces. `container.ts` is the single place the concrete implementations get bound.

## Responsive behaviour

The app targets iPhone first but is fully usable on tablet and desktop.

| Breakpoint | Navigation | Poster grid |
|---|---|---|
| `< 640px` (phone) | Fixed bottom bar | 3 columns |
| `640–767px` | Fixed bottom bar | 4 columns |
| `≥ 768px` (tablet/desktop) | Left sidebar | 5–6 columns |

Modals render as bottom sheets on phones and as centered dialogs from `md` up.

### iPhone specifics

- `viewport-fit=cover` plus `env(safe-area-inset-*)` so the Dynamic Island and home indicator never cover content
- Bottom navigation with tap targets at 55px (above Apple's 44px minimum)
- Scrollbars hidden globally; horizontal rails scroll without visible chrome
- `apple-mobile-web-app-status-bar-style: black-translucent` for a full-bleed standalone look
- 16px input font size, which is what stops iOS Safari zooming on focus
- `overscroll-behavior-y: none` to suppress rubber-band scroll in standalone mode
- Tap highlight removed; `:active` states used instead for feedback

## Data model notes

**There is no `episodes` table by design.** TMDB serves a full season in one CDN-backed call and TanStack Query caches it client-side, so mirroring episode content into Postgres would only add staleness. What Postgres stores is episode *counts* (`series.seasons_meta`), because progress bars across a whole library must not cost N TMDB calls. The `user_series_progress` view renders the entire Library screen in one query with zero TMDB requests.

**Status transitions are automatic.** A trigger on `episode_tracking` moves a series to `watching` on first check-in and to `watched` when the last episode is checked off, reversing if you un-check. `abandoned` is never overridden automatically.

**Marking a series "Watched" backfills episodes.** Because the database stores only episode counts, this fetches every season from TMDB and checks off each *aired* episode. Unaired episodes of a returning series are deliberately left alone. The episodes are written before the status so an explicit user choice always wins over the trigger.

**"Up to date" vs "finished" are different states.** `describeWatchState` in `domain/entities/Airing.ts` distinguishes them: a returning series with every aired episode watched is *up to date* (and shows the next air date), while only an ended series with every episode watched is *finished*. Aired counts are derived from TMDB's `last_episode_to_air` combined with `seasons_meta`.

## Privacy model

**Libraries are visible only to people you follow.** This is enforced in Postgres, not in the UI:

```sql
using (
  auth.uid() = user_id
  or exists (select 1 from follows f
             where f.follower_id = auth.uid() and f.following_id = user_series_status.user_id)
)
```

Unfollowing revokes access immediately. Aggregate counts (series, episodes, reviews) are public via `security definer` RPCs, matching how Letterboxd shows profile stats. Episode-level check-ins stay private to their owner.

**Username login never exposes emails.** Signing in with a username needs a username-to-email lookup. Doing that with a database RPC would leak every user's email to anyone who can guess a username, so it happens inside the `auth-login` Edge Function using the service role instead. The browser only ever receives tokens. The function returns an identical `invalid_credentials` error for both an unknown username and a wrong password, so it cannot be used to enumerate accounts.

**Usernames are claimed atomically.** The signup trigger raises on a duplicate, and because it runs inside the signup transaction the auth user is rolled back too — no orphaned account. The live availability check in the UI is a convenience, not the guard.

## Verification

Nothing here was shipped on assumption:

- **Schema** — 32 behaviour checks against real Postgres (via PGlite) covering the auth trigger, username collisions, upsert idempotency, progress math, every status transition, review constraints, cross-user RLS isolation, and cascade deletion of a user
- **Social schema** — 24 further checks: follow constraints (no self-follow, no forging), the follow-gated library policy, that unfollowing revokes access, search accuracy, and follow cascade on user deletion
- **Domain** — 24 unit checks over the airing logic: status parsing, aired-episode derivation, and every `WatchState` branch
- **Auth** — 13 checks against the live project: username signup, duplicate rejection, username/email login, case-insensitivity, no email in the response, and identical errors for wrong-password vs unknown-user
- **UI** — 40 checks driven in Chromium at iPhone 15 Pro, iPad Pro, and 1440px desktop viewports, using two real accounts that follow each other: signup, login, password reset, infinite scroll, genre filters, user search, follow/unfollow, friends feed, library filters, review deletion, and no horizontal overflow at any breakpoint

## License

MIT — see [LICENSE](LICENSE).

## Security notes

- The TMDB token lives only in Supabase secrets and is never exposed to the browser. Never put it in a `VITE_*` variable — anything so prefixed is inlined into the public bundle.
- The Supabase publishable key is safe client-side; RLS is what protects the data.
- Email confirmation is currently **disabled** for development convenience. Re-enable it in `supabase/config.toml` (`[auth.email] enable_confirmations = true`) plus `supabase config push` before exposing this publicly.
- The `series` table is a shared cache any authenticated user can write to. No personal data lives there, but if this ever goes public, make `upsert_series_from_tmdb` `security definer` and revoke direct write access.
