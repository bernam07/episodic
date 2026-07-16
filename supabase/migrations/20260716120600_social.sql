create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index idx_follows_follower on public.follows (follower_id);
create index idx_follows_following on public.follows (following_id);
create index idx_profiles_username_lower on public.profiles (lower(username));

alter table public.follows enable row level security;

create policy "follows_select_all"
  on public.follows for select
  to authenticated
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

drop policy "user_series_status_select_own" on public.user_series_status;

create policy "user_series_status_select_own_or_following"
  on public.user_series_status for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid()
        and f.following_id = user_series_status.user_id
    )
  );

create or replace function public.search_profiles(p_query text, p_limit integer default 20)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  followers_count integer,
  following_count integer,
  series_count integer,
  is_following boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_viewer uuid := auth.uid();
  v_term text;
begin
  if v_viewer is null then
    raise exception 'authentication required';
  end if;

  v_term := '%' || trim(coalesce(p_query, '')) || '%';

  return query
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    (select count(*) from public.follows f where f.following_id = p.id)::integer,
    (select count(*) from public.follows f where f.follower_id = p.id)::integer,
    (select count(*) from public.user_series_status s where s.user_id = p.id)::integer,
    exists (
      select 1 from public.follows f
      where f.follower_id = v_viewer and f.following_id = p.id
    )
  from public.profiles p
  where p.id <> v_viewer
    and (p.username ilike v_term or coalesce(p.display_name, '') ilike v_term)
  order by p.username
  limit greatest(coalesce(p_limit, 20), 1);
end;
$$;

create or replace function public.get_profile_summary(p_username text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  followers_count integer,
  following_count integer,
  series_count integer,
  episodes_watched integer,
  reviews_count integer,
  is_following boolean,
  is_self boolean
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

  return query
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    (select count(*) from public.follows f where f.following_id = p.id)::integer,
    (select count(*) from public.follows f where f.follower_id = p.id)::integer,
    (select count(*) from public.user_series_status s where s.user_id = p.id)::integer,
    (select count(*) from public.episode_tracking e where e.user_id = p.id)::integer,
    (select count(*) from public.reviews r where r.user_id = p.id)::integer,
    exists (
      select 1 from public.follows f
      where f.follower_id = v_viewer and f.following_id = p.id
    ),
    p.id = v_viewer
  from public.profiles p
  where lower(p.username) = lower(p_username);
end;
$$;

create or replace function public.get_following_feed(p_limit integer default 40)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  series_id uuid,
  tmdb_id integer,
  series_name text,
  poster_path text,
  status public.series_watch_status,
  rating numeric,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    uss.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    uss.series_id,
    s.tmdb_id,
    s.name,
    s.poster_path,
    uss.status,
    r.rating,
    uss.updated_at
  from public.user_series_status uss
  join public.profiles p on p.id = uss.user_id
  join public.series s on s.id = uss.series_id
  left join public.reviews r on r.user_id = uss.user_id and r.series_id = uss.series_id
  where uss.user_id <> auth.uid()
    and exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid() and f.following_id = uss.user_id
    )
  order by uss.updated_at desc
  limit greatest(coalesce(p_limit, 40), 1);
$$;

create or replace function public.get_user_library(p_user_id uuid, p_limit integer default 60)
returns table (
  series_id uuid,
  tmdb_id integer,
  series_name text,
  poster_path text,
  status public.series_watch_status,
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
    r.rating,
    uss.updated_at
  from public.user_series_status uss
  join public.series s on s.id = uss.series_id
  left join public.reviews r on r.user_id = uss.user_id and r.series_id = uss.series_id
  where uss.user_id = p_user_id
  order by uss.updated_at desc
  limit greatest(coalesce(p_limit, 60), 1);
$$;

create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(trim(p_username))
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested text;
  v_username text;
begin
  v_requested := nullif(trim(new.raw_user_meta_data ->> 'username'), '');

  if v_requested is not null then
    if exists (select 1 from public.profiles where lower(username) = lower(v_requested)) then
      raise exception 'username_taken' using errcode = '23505';
    end if;

    v_username := v_requested;
  else
    v_username := public.generate_unique_username(split_part(coalesce(new.email, 'user'), '@', 1));
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    v_username,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), v_username)
  );

  return new;
end;
$$;

grant execute on function public.search_profiles(text, integer) to authenticated;
grant execute on function public.get_profile_summary(text) to authenticated;
grant execute on function public.get_following_feed(integer) to authenticated;
grant execute on function public.get_user_library(uuid, integer) to authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
