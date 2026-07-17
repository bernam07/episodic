alter table public.user_series_status
  add column if not exists is_favorite boolean not null default false;

drop view if exists public.user_series_progress;

create view public.user_series_progress
with (security_invoker = on)
as
select
  uss.user_id,
  uss.series_id,
  uss.status,
  uss.is_favorite,
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

create or replace function public.toggle_favorite(p_series_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  update public.user_series_status
  set is_favorite = not is_favorite
  where user_id = auth.uid()
    and series_id = p_series_id;

  if not found then
    insert into public.user_series_status (user_id, series_id, status, is_favorite)
    values (auth.uid(), p_series_id, 'want_to_watch', true);
  end if;
end;
$$;

grant execute on function public.toggle_favorite(uuid) to authenticated;

create or replace function public.get_user_library(p_user_id uuid, p_limit integer default 60)
returns table (
  series_id uuid,
  tmdb_id integer,
  series_name text,
  poster_path text,
  status public.series_watch_status,
  is_favorite boolean,
  rating numeric,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    uss.series_id,
    s.tmdb_id,
    s.name,
    s.poster_path,
    uss.status,
    uss.is_favorite,
    r.rating,
    uss.updated_at
  from public.user_series_status uss
  join public.series s on s.id = uss.series_id
  left join public.reviews r on r.user_id = uss.user_id and r.series_id = uss.series_id
  where uss.user_id = p_user_id
  order by uss.updated_at desc
  limit greatest(coalesce(p_limit, 60), 1);
$$;

grant execute on function public.get_user_library(uuid, integer) to authenticated;
