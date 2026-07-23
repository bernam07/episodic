drop trigger if exists trg_notify_on_review on public.reviews;

create trigger trg_notify_on_review
  after insert on public.reviews
  for each row
  when (NEW.body is not null and length(trim(NEW.body)) > 0)
  execute function public.notify_on_review();

create or replace function public.sync_rating_to_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reviews
  set rating = NEW.rating
  where user_id = NEW.user_id and series_id = NEW.series_id;

  return NEW;
end;
$$;

create trigger trg_sync_rating_to_review
  after update of rating on public.user_series_status
  for each row
  when (OLD.rating is distinct from NEW.rating)
  execute function public.sync_rating_to_review();

create or replace function public.fill_review_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.rating is null then
    select rating into NEW.rating
    from public.user_series_status
    where user_id = NEW.user_id and series_id = NEW.series_id;
  end if;

  return NEW;
end;
$$;

create trigger trg_fill_review_rating
  before insert on public.reviews
  for each row
  execute function public.fill_review_rating();
