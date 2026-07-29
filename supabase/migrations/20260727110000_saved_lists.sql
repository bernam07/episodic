create table if not exists public.list_saves (
  list_id uuid not null references public.lists(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

alter table public.list_saves enable row level security;

create policy list_saves_own on public.list_saves
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.toggle_list_save(p_list_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_can boolean;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select (not is_private) and user_id <> auth.uid() into v_can
  from public.lists
  where id = p_list_id;

  if v_can is null or not v_can then
    raise exception 'cannot_save_list';
  end if;

  if exists (select 1 from public.list_saves where list_id = p_list_id and user_id = auth.uid()) then
    delete from public.list_saves where list_id = p_list_id and user_id = auth.uid();
    return false;
  end if;

  insert into public.list_saves (list_id, user_id) values (p_list_id, auth.uid());
  return true;
end;
$$;

grant execute on function public.toggle_list_save(uuid) to authenticated;

create or replace function public.get_list_save_info(p_list_id uuid)
returns table (save_count integer, saved boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::integer from public.list_saves where list_id = p_list_id),
    exists (select 1 from public.list_saves where list_id = p_list_id and user_id = auth.uid());
$$;

grant execute on function public.get_list_save_info(uuid) to authenticated;
