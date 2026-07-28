create or replace function public._activity_events(p_user_ids uuid[], p_limit integer default 40)
returns table (
  actor_id uuid,
  username text,
  display_name text,
  avatar_url text,
  event_type text,
  series_id uuid,
  tmdb_id integer,
  series_name text,
  poster_path text,
  occurred_at timestamptz,
  episode_count integer,
  rating numeric,
  review_body text
)
language sql
stable
security definer
set search_path = public
as $$
  with ev as (
    select
      uss.user_id as actor_id,
      'started'::text as event_type,
      uss.series_id,
      uss.started_at as occurred_at,
      null::integer as episode_count,
      null::numeric as rating,
      null::text as review_body
    from public.user_series_status uss
    where uss.user_id = any(p_user_ids)
      and uss.started_at is not null
      and not (
        uss.completed_at is not null
        and date_trunc('day', uss.completed_at) = date_trunc('day', uss.started_at)
      )

    union all

    select
      uss.user_id,
      'finished',
      uss.series_id,
      uss.completed_at,
      null,
      null,
      null
    from public.user_series_status uss
    where uss.user_id = any(p_user_ids)
      and uss.completed_at is not null

    union all

    select
      r.user_id,
      'reviewed',
      r.series_id,
      r.created_at,
      null,
      r.rating,
      r.body
    from public.reviews r
    where r.user_id = any(p_user_ids)
      and r.body is not null
      and length(trim(r.body)) > 0

    union all

    select
      pd.user_id,
      'progress',
      pd.series_id,
      pd.occurred_at,
      pd.episode_count,
      null,
      null
    from (
      select
        et.user_id,
        et.series_id,
        date_trunc('day', et.watched_at) as day,
        max(et.watched_at) as occurred_at,
        count(*)::integer as episode_count
      from public.episode_tracking et
      where et.user_id = any(p_user_ids)
      group by et.user_id, et.series_id, date_trunc('day', et.watched_at)
    ) pd
    where not exists (
      select 1
      from public.user_series_status uss2
      where uss2.user_id = pd.user_id
        and uss2.series_id = pd.series_id
        and uss2.completed_at is not null
        and date_trunc('day', uss2.completed_at) = pd.day
    )
  )
  select
    ev.actor_id,
    p.username,
    p.display_name,
    p.avatar_url,
    ev.event_type,
    ev.series_id,
    s.tmdb_id,
    s.name,
    s.poster_path,
    ev.occurred_at,
    ev.episode_count,
    ev.rating,
    ev.review_body
  from ev
  join public.profiles p on p.id = ev.actor_id
  join public.series s on s.id = ev.series_id
  order by ev.occurred_at desc
  limit greatest(coalesce(p_limit, 40), 1);
$$;

revoke execute on function public._activity_events(uuid[], integer) from public;
