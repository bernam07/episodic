alter table public.profiles
  add column if not exists banner_url text;

drop function if exists public.get_profile_summary(text);

create function public.get_profile_summary(p_username text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  banner_url text,
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
    p.banner_url,
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

grant execute on function public.get_profile_summary(text) to authenticated;
