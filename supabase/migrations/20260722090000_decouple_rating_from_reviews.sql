alter table public.user_series_status
  add column rating numeric(2,1) check (rating is null or (rating >= 0.5 and rating <= 5.0 and (rating * 2) = floor(rating * 2)));

update public.user_series_status uss
set rating = r.rating
from public.reviews r
where r.user_id = uss.user_id and r.series_id = uss.series_id;

alter table public.reviews
  alter column rating drop not null;

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
  uss.rating as user_rating
from public.user_series_status uss
join public.series s on s.id = uss.series_id
left join (
  select user_id, series_id, count(*) as watched_count
  from public.episode_tracking
  group by user_id, series_id
) et on et.user_id = uss.user_id and et.series_id = uss.series_id;

grant select on public.user_series_progress to authenticated;

create or replace function public.set_rating(p_series_id uuid, p_rating numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_series_status
  set rating = p_rating, updated_at = now()
  where user_id = auth.uid() and series_id = p_series_id;

  if not found then
    raise exception 'series not in library';
  end if;
end;
$$;

grant execute on function public.set_rating(uuid, numeric) to authenticated;

drop function if exists public.compare_libraries(uuid);

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
    mine.rating as my_rating,
    theirs.status as their_status,
    theirs.rating as their_rating
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
  order by s.name;
end;
$$;

grant execute on function public.compare_libraries(uuid) to authenticated;

drop function if exists public.get_series_rating_summary(uuid);

create function public.get_series_rating_summary(p_series_id uuid)
returns table (rating numeric, count integer)
language sql
stable
security invoker
set search_path = public
as $$
  select uss.rating, count(*)::integer
  from public.user_series_status uss
  where uss.series_id = p_series_id and uss.rating is not null
  group by uss.rating
  order by uss.rating;
$$;

grant execute on function public.get_series_rating_summary(uuid) to authenticated;
