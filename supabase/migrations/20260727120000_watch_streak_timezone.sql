drop function if exists public.get_watch_streak();

create or replace function public.get_watch_streak(p_tz_offset_minutes integer default 0)
returns integer
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_streak integer := 0;
  v_offset interval := make_interval(mins => coalesce(p_tz_offset_minutes, 0));
  v_today date := (((now() at time zone 'utc') - v_offset))::date;
  v_day date;
  v_has boolean;
begin
  if auth.uid() is null then
    return 0;
  end if;

  select exists (
    select 1 from public.episode_tracking
    where user_id = auth.uid() and source = 'manual'
      and (((watched_at at time zone 'utc') - v_offset))::date = v_today
  ) into v_has;

  v_day := case when v_has then v_today else v_today - 1 end;

  if not v_has then
    select exists (
      select 1 from public.episode_tracking
      where user_id = auth.uid() and source = 'manual'
        and (((watched_at at time zone 'utc') - v_offset))::date = v_day
    ) into v_has;
    if not v_has then
      return 0;
    end if;
  end if;

  loop
    select exists (
      select 1 from public.episode_tracking
      where user_id = auth.uid() and source = 'manual'
        and (((watched_at at time zone 'utc') - v_offset))::date = v_day
    ) into v_has;
    exit when not v_has;
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  end loop;

  return v_streak;
end;
$$;

grant execute on function public.get_watch_streak(integer) to authenticated;
