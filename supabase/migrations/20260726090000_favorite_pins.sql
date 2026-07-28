alter table public.user_series_status
  add column if not exists favorite_pinned_at timestamptz;

drop view if exists public.user_series_progress;

create view public.user_series_progress
with (security_invoker = on)
as
select
  uss.user_id,
  uss.series_id,
  uss.status,
  uss.is_favorite,
  uss.favorite_pinned_at,
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

create or replace function public.set_favorite_pinned(p_series_id uuid, p_pinned boolean)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pinned_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_pinned then
    select count(*) into v_pinned_count
    from public.user_series_status
    where user_id = auth.uid()
      and is_favorite = true
      and favorite_pinned_at is not null
      and series_id <> p_series_id;

    if v_pinned_count >= 3 then
      raise exception 'pin_limit_reached';
    end if;

    update public.user_series_status
    set favorite_pinned_at = now()
    where user_id = auth.uid() and series_id = p_series_id and is_favorite = true;
  else
    update public.user_series_status
    set favorite_pinned_at = null
    where user_id = auth.uid() and series_id = p_series_id;
  end if;
end;
$$;

grant execute on function public.set_favorite_pinned(uuid, boolean) to authenticated;

drop function if exists public.get_user_favorites(uuid, integer);

create function public.get_user_favorites(p_user_id uuid, p_limit integer default 60)
returns table (
  series_id uuid,
  tmdb_id integer,
  series_name text,
  poster_path text,
  status public.series_watch_status,
  rating numeric,
  pinned boolean,
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
    uss.rating,
    uss.favorite_pinned_at is not null as pinned,
    uss.updated_at
  from public.user_series_status uss
  join public.series s on s.id = uss.series_id
  where uss.user_id = p_user_id and uss.is_favorite = true
  order by (uss.favorite_pinned_at is null), uss.favorite_pinned_at asc, uss.updated_at desc
  limit greatest(coalesce(p_limit, 60), 1);
$$;

grant execute on function public.get_user_favorites(uuid, integer) to authenticated;
