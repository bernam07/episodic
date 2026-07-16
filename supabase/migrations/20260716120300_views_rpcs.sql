create view public.user_series_progress
with (security_invoker = on)
as
select
  uss.user_id,
  uss.series_id,
  uss.status,
  uss.started_at,
  uss.completed_at,
  uss.updated_at,
  s.tmdb_id,
  s.name,
  s.poster_path,
  s.backdrop_path,
  s.number_of_seasons,
  s.number_of_episodes,
  coalesce(et.watched_count, 0)::integer as watched_episodes,
  greatest(s.number_of_episodes - coalesce(et.watched_count, 0), 0)::integer as remaining_episodes,
  case
    when s.number_of_episodes > 0
      then round((coalesce(et.watched_count, 0)::numeric / s.number_of_episodes) * 100, 1)
    else 0
  end as progress_percent,
  r.rating as user_rating
from public.user_series_status uss
join public.series s on s.id = uss.series_id
left join (
  select user_id, series_id, count(*) as watched_count
  from public.episode_tracking
  group by user_id, series_id
) et on et.user_id = uss.user_id and et.series_id = uss.series_id
left join public.reviews r on r.user_id = uss.user_id and r.series_id = uss.series_id;

create or replace function public.get_season_progress(p_series_id uuid)
returns table (
  season_number integer,
  total_episodes integer,
  watched_episodes integer,
  progress_percent numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (meta ->> 'season_number')::integer as season_number,
    (meta ->> 'episode_count')::integer as total_episodes,
    coalesce(w.watched, 0)::integer as watched_episodes,
    case
      when (meta ->> 'episode_count')::integer > 0
        then round((coalesce(w.watched, 0)::numeric / (meta ->> 'episode_count')::integer) * 100, 1)
      else 0
    end as progress_percent
  from public.series s
  cross join lateral jsonb_array_elements(s.seasons_meta) as meta
  left join lateral (
    select count(*) as watched
    from public.episode_tracking et
    where et.series_id = s.id
      and et.user_id = auth.uid()
      and et.season_number = (meta ->> 'season_number')::integer
  ) w on true
  where s.id = p_series_id
  order by 1;
$$;

create or replace function public.set_season_watched(
  p_series_id uuid,
  p_season_number integer,
  p_episodes jsonb,
  p_watched boolean
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_affected integer := 0;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_watched then
    insert into public.episode_tracking (user_id, series_id, tmdb_episode_id, season_number, episode_number)
    select
      auth.uid(),
      p_series_id,
      (e ->> 'tmdb_episode_id')::integer,
      p_season_number,
      (e ->> 'episode_number')::integer
    from jsonb_array_elements(p_episodes) as e
    on conflict (user_id, tmdb_episode_id) do nothing;

    get diagnostics v_affected = row_count;
  else
    delete from public.episode_tracking
    where user_id = auth.uid()
      and series_id = p_series_id
      and season_number = p_season_number;

    get diagnostics v_affected = row_count;
  end if;

  return v_affected;
end;
$$;

create or replace function public.get_continue_watching(p_limit integer default 10)
returns table (
  series_id uuid,
  tmdb_id integer,
  name text,
  poster_path text,
  watched_episodes integer,
  number_of_episodes integer,
  progress_percent numeric,
  last_watched_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.series_id,
    p.tmdb_id,
    p.name,
    p.poster_path,
    p.watched_episodes,
    p.number_of_episodes,
    p.progress_percent,
    max(et.watched_at) as last_watched_at
  from public.user_series_progress p
  left join public.episode_tracking et
    on et.series_id = p.series_id and et.user_id = p.user_id
  where p.user_id = auth.uid()
    and p.status = 'watching'
  group by p.series_id, p.tmdb_id, p.name, p.poster_path,
           p.watched_episodes, p.number_of_episodes, p.progress_percent
  order by last_watched_at desc nulls last
  limit greatest(coalesce(p_limit, 10), 1);
$$;

create or replace function public.upsert_series_from_tmdb(p_payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_series_id uuid;
begin
  insert into public.series (
    tmdb_id, name, overview, poster_path, backdrop_path,
    first_air_date, last_air_date, number_of_seasons, number_of_episodes,
    vote_average, genres, tmdb_status, seasons_meta, synced_at
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
    vote_average = excluded.vote_average,
    genres = excluded.genres,
    tmdb_status = excluded.tmdb_status,
    seasons_meta = excluded.seasons_meta,
    synced_at = now()
  returning id into v_series_id;

  return v_series_id;
end;
$$;

grant select on public.user_series_progress to authenticated;
grant execute on function public.get_season_progress(uuid) to authenticated;
grant execute on function public.set_season_watched(uuid, integer, jsonb, boolean) to authenticated;
grant execute on function public.get_continue_watching(integer) to authenticated;
grant execute on function public.upsert_series_from_tmdb(jsonb) to authenticated;
