alter table public.episode_tracking
  add column if not exists source text not null default 'manual';

create or replace function public.set_series_watched(
  p_series_id uuid,
  p_episodes jsonb
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_affected integer := 0;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.episode_tracking (user_id, series_id, tmdb_episode_id, season_number, episode_number, source)
  select
    auth.uid(),
    p_series_id,
    (e ->> 'tmdb_episode_id')::integer,
    (e ->> 'season_number')::integer,
    (e ->> 'episode_number')::integer,
    'bulk'
  from jsonb_array_elements(p_episodes) as e
  on conflict (user_id, tmdb_episode_id) do nothing;

  get diagnostics v_affected = row_count;

  return v_affected;
end;
$$;

create or replace function public.set_season_watched(
  p_series_id uuid,
  p_season_number integer,
  p_episodes jsonb,
  p_watched boolean
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_affected integer := 0;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_watched then
    insert into public.episode_tracking (user_id, series_id, tmdb_episode_id, season_number, episode_number, source)
    select
      auth.uid(),
      p_series_id,
      (e ->> 'tmdb_episode_id')::integer,
      p_season_number,
      (e ->> 'episode_number')::integer,
      'bulk'
    from jsonb_array_elements(p_episodes) as e
    on conflict (user_id, tmdb_episode_id) do nothing;

    get diagnostics v_affected = row_count;
  else
    delete from public.episode_tracking
    where user_id = auth.uid()
      and series_id = p_series_id
      and season_number = p_season_number;

    get diagnostics v_affected = row_count;
  end if;

  return v_affected;
end;
$$;

create or replace function public.get_watch_streak()
returns integer
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_streak integer := 0;
  v_day date := current_date;
  v_has boolean;
begin
  if auth.uid() is null then
    return 0;
  end if;

  select exists (
    select 1 from public.episode_tracking
    where user_id = auth.uid() and source = 'manual'
      and (watched_at at time zone 'utc')::date = current_date
  ) into v_has;

  if not v_has then
    v_day := current_date - 1;
    select exists (
      select 1 from public.episode_tracking
      where user_id = auth.uid() and source = 'manual'
        and (watched_at at time zone 'utc')::date = v_day
    ) into v_has;
    if not v_has then
      return 0;
    end if;
  end if;

  loop
    select exists (
      select 1 from public.episode_tracking
      where user_id = auth.uid() and source = 'manual'
        and (watched_at at time zone 'utc')::date = v_day
    ) into v_has;
    exit when not v_has;
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  end loop;

  return v_streak;
end;
$$;

grant execute on function public.get_watch_streak() to authenticated;
