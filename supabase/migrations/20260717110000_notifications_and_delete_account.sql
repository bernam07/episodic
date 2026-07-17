create type public.notification_type as enum ('follow', 'review');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  series_id uuid references public.series (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id, created_at desc);
create index idx_notifications_actor on public.notifications (actor_id);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$;

create trigger trg_notify_on_follow
  after insert on public.follows
  for each row
  execute function public.notify_on_follow();

create or replace function public.notify_on_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, series_id)
  select f.follower_id, new.user_id, 'review', new.series_id
  from public.follows f
  where f.following_id = new.user_id
    and f.follower_id <> new.user_id;
  return new;
end;
$$;

create trigger trg_notify_on_review
  after insert on public.reviews
  for each row
  execute function public.notify_on_review();

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
  series_poster_path text
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
    s.poster_path
  from public.notifications n
  join public.profiles p on p.id = n.actor_id
  left join public.series s on s.id = n.series_id
  where n.user_id = auth.uid()
  order by n.created_at desc
  limit greatest(coalesce(p_limit, 50), 1);
$$;

create function public.mark_notifications_read()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.notifications
  set read = true
  where user_id = auth.uid()
    and read = false;
end;
$$;

create function public.get_unread_notification_count()
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::integer
  from public.notifications
  where user_id = auth.uid()
    and read = false;
$$;

create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  delete from public.profiles where id = v_uid;

  delete from auth.users where id = v_uid;
end;
$$;

grant execute on function public.get_notifications(integer) to authenticated;
grant execute on function public.mark_notifications_read() to authenticated;
grant execute on function public.get_unread_notification_count() to authenticated;
grant execute on function public.delete_own_account() to authenticated;
