alter table public.series add column if not exists aired_episodes integer not null default 0;

update public.series
  set aired_episodes = number_of_episodes
  where lower(coalesce(tmdb_status, '')) in ('ended', 'canceled', 'cancelled');

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
    aired_episodes, vote_average, genres, tmdb_status, seasons_meta, synced_at
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
    vote_average = excluded.vote_average,
    genres = excluded.genres,
    tmdb_status = excluded.tmdb_status,
    seasons_meta = excluded.seasons_meta,
    synced_at = now()
  returning id into v_series_id;

  return v_series_id;
end;
$$;

create or replace function public.get_up_next(p_limit integer default 20)
returns table (
  series_id uuid,
  tmdb_id integer,
  name text,
  poster_path text,
  next_season integer,
  next_episode integer,
  watched_episodes integer,
  aired_episodes integer,
  number_of_episodes integer,
  last_watched_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with watching as (
    select
      uss.series_id,
      s.tmdb_id,
      s.name,
      s.poster_path,
      s.aired_episodes,
      s.number_of_episodes,
      s.seasons_meta
    from public.user_series_status uss
    join public.series s on s.id = uss.series_id
    where uss.user_id = auth.uid() and uss.status = 'watching'
  ),
  episodes as (
    select
      w.series_id,
      w.tmdb_id,
      w.name,
      w.poster_path,
      w.aired_episodes,
      w.number_of_episodes,
      (meta ->> 'season_number')::integer as season_number,
      gs.episode_number,
      row_number() over (
        partition by w.series_id
        order by (meta ->> 'season_number')::integer, gs.episode_number
      ) as ordinal
    from watching w
    cross join lateral jsonb_array_elements(w.seasons_meta) as meta
    cross join lateral generate_series(1, (meta ->> 'episode_count')::integer) as gs(episode_number)
  ),
  next_ep as (
    select distinct on (e.series_id)
      e.series_id,
      e.tmdb_id,
      e.name,
      e.poster_path,
      e.season_number,
      e.episode_number,
      e.aired_episodes,
      e.number_of_episodes
    from episodes e
    left join public.episode_tracking et
      on et.user_id = auth.uid()
      and et.series_id = e.series_id
      and et.season_number = e.season_number
      and et.episode_number = e.episode_number
    where et.id is null
      and e.ordinal <= e.aired_episodes
    order by e.series_id, e.ordinal
  )
  select
    ne.series_id,
    ne.tmdb_id,
    ne.name,
    ne.poster_path,
    ne.season_number,
    ne.episode_number,
    (select count(*)::integer from public.episode_tracking et
       where et.user_id = auth.uid() and et.series_id = ne.series_id),
    ne.aired_episodes,
    ne.number_of_episodes,
    (select max(watched_at) from public.episode_tracking et
       where et.user_id = auth.uid() and et.series_id = ne.series_id)
  from next_ep ne
  order by (select max(watched_at) from public.episode_tracking et
              where et.user_id = auth.uid() and et.series_id = ne.series_id) desc nulls last
  limit greatest(coalesce(p_limit, 20), 1);
$$;

grant execute on function public.get_up_next(integer) to authenticated;
