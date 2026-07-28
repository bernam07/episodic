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
  s.genres,
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

grant select on public.user_series_progress to authenticated;

create function public.compare_libraries(p_other_user_id uuid)
returns table (
  tmdb_id integer,
  series_name text,
  poster_path text,
  genres text[],
  my_status public.series_watch_status,
  my_rating numeric,
  their_status public.series_watch_status,
  their_rating numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1 from public.follows f
    where f.follower_id = v_viewer and f.following_id = p_other_user_id
  ) then
    raise exception 'must follow user to compare libraries';
  end if;

  return query
  select
    s.tmdb_id,
    s.name,
    s.poster_path,
    s.genres,
    mine.status as my_status,
    mr.rating as my_rating,
    theirs.status as their_status,
    tr.rating as their_rating
  from (
    select series_id from public.user_series_status where user_id = v_viewer
    union
    select series_id from public.user_series_status where user_id = p_other_user_id
  ) combined
  join public.series s on s.id = combined.series_id
  left join public.user_series_status mine
    on mine.user_id = v_viewer and mine.series_id = combined.series_id
  left join public.user_series_status theirs
    on theirs.user_id = p_other_user_id and theirs.series_id = combined.series_id
  left join public.reviews mr
    on mr.user_id = v_viewer and mr.series_id = combined.series_id
  left join public.reviews tr
    on tr.user_id = p_other_user_id and tr.series_id = combined.series_id
  order by s.name;
end;
$$;

grant execute on function public.compare_libraries(uuid) to authenticated;
