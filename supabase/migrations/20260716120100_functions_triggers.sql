create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_series_updated_at
  before update on public.series
  for each row execute function public.handle_updated_at();

create trigger set_user_series_status_updated_at
  before update on public.user_series_status
  for each row execute function public.handle_updated_at();

create trigger set_reviews_updated_at
  before update on public.reviews
  for each row execute function public.handle_updated_at();

create or replace function public.generate_unique_username(p_seed text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_candidate text;
  v_suffix integer := 0;
begin
  v_base := lower(regexp_replace(coalesce(p_seed, 'user'), '[^a-zA-Z0-9_]', '', 'g'));

  if char_length(v_base) < 3 then
    v_base := v_base || 'user';
  end if;

  v_base := left(v_base, 20);
  v_candidate := v_base;

  while exists (select 1 from public.profiles where username = v_candidate) loop
    v_suffix := v_suffix + 1;
    v_candidate := left(v_base, 20 - char_length(v_suffix::text)) || v_suffix::text;
  end loop;

  return v_candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seed text;
begin
  v_seed := coalesce(
    new.raw_user_meta_data ->> 'username',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    public.generate_unique_username(v_seed),
    coalesce(new.raw_user_meta_data ->> 'display_name', v_seed)
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
  v_watched integer;
  v_current public.series_watch_status;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  v_series_id := coalesce(new.series_id, old.series_id);

  select number_of_episodes into v_total
    from public.series where id = v_series_id;

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

  if v_total > 0 and v_watched >= v_total then
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

create trigger sync_status_on_episode_change
  after insert or delete on public.episode_tracking
  for each row execute function public.sync_series_status();

create or replace function public.stamp_status_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'watching' and new.started_at is null then
    new.started_at = now();
  end if;

  if new.status = 'watched' and new.completed_at is null then
    new.completed_at = now();
  end if;

  if new.status in ('want_to_watch', 'watching') then
    new.completed_at = null;
  end if;

  return new;
end;
$$;

create trigger stamp_user_series_status_timestamps
  before insert or update on public.user_series_status
  for each row execute function public.stamp_status_timestamps();
