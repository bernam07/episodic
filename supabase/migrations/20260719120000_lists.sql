create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text check (description is null or char_length(description) <= 500),
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.list_items (
  list_id uuid not null references public.lists (id) on delete cascade,
  series_id uuid not null references public.series (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (list_id, series_id)
);

create index idx_lists_user on public.lists (user_id, updated_at desc);
create index idx_list_items_list on public.list_items (list_id, added_at desc);

create trigger set_lists_updated_at
  before update on public.lists
  for each row execute function public.handle_updated_at();

create or replace function public.touch_list_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lists set updated_at = now()
  where id = coalesce(new.list_id, old.list_id);
  return coalesce(new, old);
end;
$$;

create trigger list_items_touch_list
  after insert or delete on public.list_items
  for each row execute function public.touch_list_updated_at();

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

create policy "lists_select_visible"
  on public.lists for select
  to authenticated
  using (not is_private or auth.uid() = user_id);

create policy "lists_insert_own"
  on public.lists for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "lists_update_own"
  on public.lists for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "lists_delete_own"
  on public.lists for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "list_items_select_visible"
  on public.list_items for select
  to authenticated
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_id and (not l.is_private or l.user_id = auth.uid())
    )
  );

create policy "list_items_insert_own"
  on public.list_items for insert
  to authenticated
  with check (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );

create policy "list_items_delete_own"
  on public.list_items for delete
  to authenticated
  using (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );

create or replace function public.get_user_lists(p_user_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  is_private boolean,
  item_count integer,
  updated_at timestamptz,
  poster_paths text[]
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    l.id,
    l.title,
    l.description,
    l.is_private,
    (select count(*) from public.list_items li where li.list_id = l.id)::integer,
    l.updated_at,
    coalesce(
      (
        select array_agg(t.poster_path)
        from (
          select s.poster_path
          from public.list_items li
          join public.series s on s.id = li.series_id
          where li.list_id = l.id and s.poster_path is not null
          order by li.added_at desc
          limit 4
        ) t
      ),
      '{}'
    )
  from public.lists l
  where l.user_id = p_user_id
  order by l.updated_at desc;
$$;

create or replace function public.get_list(p_list_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  is_private boolean,
  item_count integer,
  updated_at timestamptz,
  owner_id uuid,
  owner_username text,
  owner_display_name text,
  owner_avatar_url text,
  is_own boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    l.id,
    l.title,
    l.description,
    l.is_private,
    (select count(*) from public.list_items li where li.list_id = l.id)::integer,
    l.updated_at,
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    l.user_id = auth.uid()
  from public.lists l
  join public.profiles p on p.id = l.user_id
  where l.id = p_list_id;
$$;

create or replace function public.get_list_items(p_list_id uuid)
returns table (
  series_id uuid,
  tmdb_id integer,
  series_name text,
  poster_path text,
  added_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    li.series_id,
    s.tmdb_id,
    s.name,
    s.poster_path,
    li.added_at
  from public.list_items li
  join public.series s on s.id = li.series_id
  where li.list_id = p_list_id
  order by li.added_at desc;
$$;

grant execute on function public.get_user_lists(uuid) to authenticated;
grant execute on function public.get_list(uuid) to authenticated;
grant execute on function public.get_list_items(uuid) to authenticated;
