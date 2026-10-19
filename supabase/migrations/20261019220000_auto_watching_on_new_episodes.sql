create or replace function public.sync_series_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_series_id uuid;
  v_total integer;
  v_aired integer;
  v_target integer;
  v_watched integer;
  v_current public.series_watch_status;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  v_series_id := coalesce(new.series_id, old.series_id);

  select number_of_episodes, aired_episodes into v_total, v_aired
    from public.series where id = v_series_id;

  v_target := case
    when coalesce(v_aired, 0) > 0 then v_aired
    else coalesce(v_total, 0)
  end;

  select count(*) into v_watched
    from public.episode_tracking
    where user_id = v_user_id and series_id = v_series_id;

  select status into v_current
    from public.user_series_status
    where user_id = v_user_id and series_id = v_series_id;

  if v_current is null then
    insert into public.user_series_status (user_id, series_id, status, started_at)
    values (v_user_id, v_series_id, 'watching', now());
    return coalesce(new, old);
  end if;

  if v_current = 'abandoned' then
    return coalesce(new, old);
  end if;

  if v_target > 0 and v_watched >= v_target then
    update public.user_series_status
      set status = 'watched',
          completed_at = coalesce(completed_at, now()),
          started_at = coalesce(started_at, now())
      where user_id = v_user_id and series_id = v_series_id and status <> 'watched';
  elsif v_watched > 0 then
    update public.user_series_status
      set status = 'watching',
          completed_at = null,
          started_at = coalesce(started_at, now())
      where user_id = v_user_id and series_id = v_series_id and status <> 'watching';
  else
    update public.user_series_status
      set status = 'want_to_watch',
          completed_at = null
      where user_id = v_user_id and series_id = v_series_id and status = 'watching';
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.sync_status_on_series_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target integer;
begin
  v_target := case
    when coalesce(new.aired_episodes, 0) > 0 then new.aired_episodes
    else coalesce(new.number_of_episodes, 0)
  end;

  if v_target > 0 and (
    coalesce(new.aired_episodes, 0) > coalesce(old.aired_episodes, 0)
    or (
      coalesce(new.aired_episodes, 0) = 0
      and coalesce(new.number_of_episodes, 0) > coalesce(old.number_of_episodes, 0)
    )
  ) then
    update public.user_series_status uss
    set status = 'watching',
        completed_at = null
    where uss.series_id = new.id
      and uss.status = 'watched'
      and (
        select count(*)::integer
        from public.episode_tracking et
        where et.user_id = uss.user_id
          and et.series_id = new.id
      ) < v_target;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_status_on_series_aired_change on public.series;

create trigger sync_status_on_series_aired_change
  after update on public.series
  for each row execute function public.sync_status_on_series_update();

update public.user_series_status uss
set status = 'watching',
    completed_at = null
from public.series s
where s.id = uss.series_id
  and uss.status = 'watched'
  and coalesce(s.aired_episodes, 0) > 0
  and (
    select count(*)::integer
    from public.episode_tracking et
    where et.user_id = uss.user_id
      and et.series_id = uss.series_id
  ) between 1 and s.aired_episodes - 1;

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
  s.tmdb_status,
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

drop function if exists public.get_user_library(uuid, integer);

create function public.get_user_library(p_user_id uuid, p_limit integer default 60)
returns table (
  series_id uuid,
  tmdb_id integer,
  series_name text,
  poster_path text,
  status public.series_watch_status,
  is_favorite boolean,
  rating numeric,
  tmdb_status text,
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
    coalesce(uss.rating, r.rating) as rating,
    s.tmdb_status,
    uss.updated_at
  from public.user_series_status uss
  join public.series s on s.id = uss.series_id
  left join public.reviews r on r.user_id = uss.user_id and r.series_id = uss.series_id
  where uss.user_id = p_user_id
  order by uss.updated_at desc
  limit greatest(coalesce(p_limit, 60), 1);
$$;

grant execute on function public.get_user_library(uuid, integer) to authenticated;
