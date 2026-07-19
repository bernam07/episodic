create or replace function public.get_series_rating_summary(p_series_id uuid)
returns table (
  rating numeric,
  count integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select r.rating, count(*)::integer
  from public.reviews r
  where r.series_id = p_series_id
  group by r.rating
  order by r.rating;
$$;

grant execute on function public.get_series_rating_summary(uuid) to authenticated;
