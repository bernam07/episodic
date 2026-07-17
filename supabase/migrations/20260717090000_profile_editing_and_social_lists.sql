alter table public.profiles
  add column bio text check (bio is null or char_length(bio) <= 160);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_select_all"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop function public.get_profile_summary(text);

create function public.get_profile_summary(p_username text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
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
    p.bio,
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

create function public.get_followers(p_username text, p_limit integer default 60)
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
  v_target uuid;
begin
  if v_viewer is null then
    raise exception 'authentication required';
  end if;

  select p.id into v_target from public.profiles p where lower(p.username) = lower(p_username);

  if v_target is null then
    return;
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
    exists (
      select 1 from public.follows f
      where f.follower_id = v_viewer and f.following_id = p.id
    )
  from public.follows f
  join public.profiles p on p.id = f.follower_id
  where f.following_id = v_target
  order by p.username
  limit greatest(coalesce(p_limit, 60), 1);
end;
$$;

create function public.get_following(p_username text, p_limit integer default 60)
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
  v_target uuid;
begin
  if v_viewer is null then
    raise exception 'authentication required';
  end if;

  select p.id into v_target from public.profiles p where lower(p.username) = lower(p_username);

  if v_target is null then
    return;
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
    exists (
      select 1 from public.follows f
      where f.follower_id = v_viewer and f.following_id = p.id
    )
  from public.follows f
  join public.profiles p on p.id = f.following_id
  where f.follower_id = v_target
  order by p.username
  limit greatest(coalesce(p_limit, 60), 1);
end;
$$;

grant execute on function public.get_profile_summary(text) to authenticated;
grant execute on function public.get_followers(text, integer) to authenticated;
grant execute on function public.get_following(text, integer) to authenticated;
