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

  insert into public.episode_tracking (user_id, series_id, tmdb_episode_id, season_number, episode_number)
  select
    auth.uid(),
    p_series_id,
    (e ->> 'tmdb_episode_id')::integer,
    (e ->> 'season_number')::integer,
    (e ->> 'episode_number')::integer
  from jsonb_array_elements(p_episodes) as e
  on conflict (user_id, tmdb_episode_id) do nothing;

  get diagnostics v_affected = row_count;

  return v_affected;
end;
$$;

create or replace function public.clear_series_episodes(p_series_id uuid)
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

  delete from public.episode_tracking
  where user_id = auth.uid()
    and series_id = p_series_id;

  get diagnostics v_affected = row_count;

  return v_affected;
end;
$$;

grant execute on function public.set_series_watched(uuid, jsonb) to authenticated;
grant execute on function public.clear_series_episodes(uuid) to authenticated;
