drop function if exists public.get_user_favorites(uuid, integer);

create function public.get_user_favorites(p_user_id uuid, p_limit integer default 60)
returns table (
  series_id uuid,
  tmdb_id integer,
  series_name text,
  poster_path text,
  status public.series_watch_status,
  rating numeric,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    uss.series_id,
    s.tmdb_id,
    s.name,
    s.poster_path,
    uss.status,
    uss.rating,
    uss.updated_at
  from public.user_series_status uss
  join public.series s on s.id = uss.series_id
  where uss.user_id = p_user_id and uss.is_favorite = true
  order by uss.updated_at desc
  limit greatest(coalesce(p_limit, 60), 1);
$$;

grant execute on function public.get_user_favorites(uuid, integer) to authenticated;
