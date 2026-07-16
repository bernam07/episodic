create type public.series_watch_status as enum (
  'want_to_watch',
  'watching',
  'watched',
  'abandoned'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.series (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique not null,
  name text not null,
  overview text,
  poster_path text,
  backdrop_path text,
  first_air_date date,
  last_air_date date,
  number_of_seasons integer not null default 0,
  number_of_episodes integer not null default 0,
  vote_average numeric(3,1),
  genres text[] not null default '{}',
  tmdb_status text,
  seasons_meta jsonb not null default '[]'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_series_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  series_id uuid not null references public.series (id) on delete cascade,
  status public.series_watch_status not null default 'want_to_watch',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, series_id)
);

create table public.episode_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  series_id uuid not null references public.series (id) on delete cascade,
  tmdb_episode_id integer not null,
  season_number integer not null check (season_number >= 0),
  episode_number integer not null check (episode_number >= 0),
  watched_at timestamptz not null default now(),
  unique (user_id, tmdb_episode_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  series_id uuid not null references public.series (id) on delete cascade,
  rating numeric(2,1) not null check (rating >= 0.5 and rating <= 5.0 and (rating * 2) = floor(rating * 2)),
  body text check (body is null or char_length(body) <= 2000),
  contains_spoilers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, series_id)
);

create index idx_series_tmdb_id on public.series (tmdb_id);
create index idx_uss_user_status on public.user_series_status (user_id, status);
create index idx_uss_series on public.user_series_status (series_id);
create index idx_et_user_series on public.episode_tracking (user_id, series_id);
create index idx_et_user_series_season on public.episode_tracking (user_id, series_id, season_number);
create index idx_et_recent on public.episode_tracking (user_id, watched_at desc);
create index idx_reviews_series on public.reviews (series_id, created_at desc);
create index idx_reviews_user on public.reviews (user_id, created_at desc);
