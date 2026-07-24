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
  seasons as (
    select
      w.series_id,
      (meta ->> 'season_number')::integer as season_number,
      (meta ->> 'episode_count')::integer as episode_count
    from watching w
    cross join lateral jsonb_array_elements(w.seasons_meta) as meta
    where (meta ->> 'episode_count')::integer > 0
  ),
  cumulative as (
    select
      se.*,
      coalesce(
        sum(se.episode_count) over (
          partition by se.series_id
          order by se.season_number
          rows between unbounded preceding and 1 preceding
        ),
        0
      )::integer as prior_episodes
    from seasons se
  ),
  watched_per_season as (
    select et.series_id, et.season_number, count(*)::integer as watched
    from public.episode_tracking et
    where et.user_id = auth.uid()
    group by et.series_id, et.season_number
  ),
  next_ep as (
    select distinct on (c.series_id)
      c.series_id,
      c.season_number,
      coalesce(wps.watched, 0) + 1 as next_index,
      c.prior_episodes + coalesce(wps.watched, 0) + 1 as ordinal
    from cumulative c
    left join watched_per_season wps
      on wps.series_id = c.series_id and wps.season_number = c.season_number
    where coalesce(wps.watched, 0) < c.episode_count
    order by c.series_id, c.season_number
  )
  select
    w.series_id,
    w.tmdb_id,
    w.name,
    w.poster_path,
    ne.season_number,
    ne.next_index,
    (select count(*)::integer from public.episode_tracking et
       where et.user_id = auth.uid() and et.series_id = w.series_id),
    w.aired_episodes,
    w.number_of_episodes,
    (select max(watched_at) from public.episode_tracking et
       where et.user_id = auth.uid() and et.series_id = w.series_id)
  from next_ep ne
  join watching w on w.series_id = ne.series_id
  where ne.ordinal <= w.aired_episodes
  order by (select max(watched_at) from public.episode_tracking et
              where et.user_id = auth.uid() and et.series_id = w.series_id) desc nulls last
  limit greatest(coalesce(p_limit, 20), 1);
$$;

grant execute on function public.get_up_next(integer) to authenticated;
