alter table public.notifications alter column actor_id drop not null;
alter table public.notifications add column if not exists season_number integer;
alter table public.notifications add column if not exists episode_number integer;

drop function if exists public.get_notifications(integer);

create function public.get_notifications(p_limit integer default 50)
returns table (
  id uuid,
  type public.notification_type,
  read boolean,
  created_at timestamptz,
  actor_id uuid,
  actor_username text,
  actor_display_name text,
  actor_avatar_url text,
  series_id uuid,
  series_tmdb_id integer,
  series_name text,
  series_poster_path text,
  season_number integer,
  episode_number integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    n.id,
    n.type,
    n.read,
    n.created_at,
    n.actor_id,
    p.username,
    p.display_name,
    p.avatar_url,
    n.series_id,
    s.tmdb_id,
    s.name,
    s.poster_path,
    n.season_number,
    n.episode_number
  from public.notifications n
  left join public.profiles p on p.id = n.actor_id
  left join public.series s on s.id = n.series_id
  where n.user_id = auth.uid()
  order by n.created_at desc
  limit greatest(coalesce(p_limit, 50), 1);
$$;

grant execute on function public.get_notifications(integer) to authenticated;
