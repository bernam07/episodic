alter table public.series add column if not exists episode_runtime integer not null default 0;

create or replace function public.upsert_series_from_tmdb(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_series_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.series (
    tmdb_id, name, overview, poster_path, backdrop_path,
    first_air_date, last_air_date, number_of_seasons, number_of_episodes,
    aired_episodes, episode_runtime, vote_average, genres, tmdb_status, seasons_meta, synced_at
  )
  values (
    (p_payload ->> 'tmdb_id')::integer,
    p_payload ->> 'name',
    p_payload ->> 'overview',
    p_payload ->> 'poster_path',
    p_payload ->> 'backdrop_path',
    nullif(p_payload ->> 'first_air_date', '')::date,
    nullif(p_payload ->> 'last_air_date', '')::date,
    coalesce((p_payload ->> 'number_of_seasons')::integer, 0),
    coalesce((p_payload ->> 'number_of_episodes')::integer, 0),
    coalesce((p_payload ->> 'aired_episodes')::integer, 0),
    coalesce((p_payload ->> 'episode_runtime')::integer, 0),
    nullif(p_payload ->> 'vote_average', '')::numeric,
    coalesce(
      (select array_agg(value #>> '{}') from jsonb_array_elements(coalesce(p_payload -> 'genres', '[]'::jsonb))),
      '{}'
    ),
    p_payload ->> 'tmdb_status',
    coalesce(p_payload -> 'seasons_meta', '[]'::jsonb),
    now()
  )
  on conflict (tmdb_id) do update set
    name = excluded.name,
    overview = excluded.overview,
    poster_path = excluded.poster_path,
    backdrop_path = excluded.backdrop_path,
    first_air_date = excluded.first_air_date,
    last_air_date = excluded.last_air_date,
    number_of_seasons = excluded.number_of_seasons,
    number_of_episodes = excluded.number_of_episodes,
    aired_episodes = excluded.aired_episodes,
    episode_runtime = excluded.episode_runtime,
    vote_average = excluded.vote_average,
    genres = excluded.genres,
    tmdb_status = excluded.tmdb_status,
    seasons_meta = excluded.seasons_meta,
    synced_at = now()
  returning id into v_series_id;

  return v_series_id;
end;
$$;

drop view if exists public.user_series_progress;

create view public.user_series_progress
with (security_invoker = on)
as
select
  uss.user_id,
  uss.series_id,
  uss.status,
  uss.is_favorite,
  uss.rewatch_count,
  uss.started_at,
  uss.completed_at,
  uss.updated_at,
  s.tmdb_id,
  s.name,
  s.poster_path,
  s.backdrop_path,
  s.number_of_seasons,
  s.number_of_episodes,
  s.aired_episodes,
  s.episode_runtime,
  s.genres,
  coalesce(et.watched_count, 0)::integer as watched_episodes,
  greatest(s.number_of_episodes - coalesce(et.watched_count, 0), 0)::integer as remaining_episodes,
  case
    when s.number_of_episodes > 0
      then round((coalesce(et.watched_count, 0)::numeric / s.number_of_episodes) * 100, 1)
    else 0
  end as progress_percent,
  uss.rating as user_rating
from public.user_series_status uss
join public.series s on s.id = uss.series_id
left join (
  select user_id, series_id, count(*) as watched_count
  from public.episode_tracking
  group by user_id, series_id
) et on et.user_id = uss.user_id and et.series_id = uss.series_id;

grant select on public.user_series_progress to authenticated;
