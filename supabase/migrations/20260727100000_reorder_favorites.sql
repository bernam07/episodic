create or replace function public.reorder_favorites(p_series_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_base timestamptz := now();
  v_idx integer := 0;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  foreach v_id in array p_series_ids loop
    update public.user_series_status
    set favorite_pinned_at = v_base + (v_idx * interval '1 second')
    where user_id = auth.uid()
      and series_id = v_id
      and is_favorite = true
      and favorite_pinned_at is not null;
    v_idx := v_idx + 1;
  end loop;
end;
$$;

grant execute on function public.reorder_favorites(uuid[]) to authenticated;
