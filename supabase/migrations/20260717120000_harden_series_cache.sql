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

drop policy if exists "series_insert_authenticated" on public.series;
drop policy if exists "series_update_authenticated" on public.series;

revoke insert, update, delete on public.series from authenticated;
