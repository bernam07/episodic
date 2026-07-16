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

  if not exists (select 1 from public.profiles where id = v_user_id) then
    return coalesce(new, old);
  end if;

  select number_of_episodes into v_total
    from public.series where id = v_series_id;

  if not found then
    return coalesce(new, old);
  end if;

  select count(*) into v_watched
    from public.episode_tracking
    where user_id = v_user_id and series_id = v_series_id;

  select status into v_current
    from public.user_series_status
    where user_id = v_user_id and series_id = v_series_id;

  if v_current is null then
    if tg_op = 'DELETE' then
      return old;
    end if;

    insert into public.user_series_status (user_id, series_id, status, started_at)
    values (v_user_id, v_series_id, 'watching', now())
    on conflict (user_id, series_id) do nothing;

    return new;
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
