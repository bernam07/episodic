alter table public.user_series_status
  add column if not exists rewatch_count integer not null default 0;

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

create or replace function public.bump_rewatch(p_series_id uuid, p_delta integer)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  update public.user_series_status
  set rewatch_count = greatest(rewatch_count + p_delta, 0)
  where user_id = auth.uid() and series_id = p_series_id
  returning rewatch_count into v_count;

  return coalesce(v_count, 0);
end;
$$;

grant execute on function public.bump_rewatch(uuid, integer) to authenticated;
