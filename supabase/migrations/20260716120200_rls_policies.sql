alter table public.profiles enable row level security;
alter table public.series enable row level security;
alter table public.user_series_status enable row level security;
alter table public.episode_tracking enable row level security;
alter table public.reviews enable row level security;

create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "series_select_all"
  on public.series for select
  to authenticated
  using (true);

create policy "series_insert_authenticated"
  on public.series for insert
  to authenticated
  with check (true);

create policy "series_update_authenticated"
  on public.series for update
  to authenticated
  using (true)
  with check (true);

create policy "user_series_status_select_own"
  on public.user_series_status for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_series_status_insert_own"
  on public.user_series_status for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_series_status_update_own"
  on public.user_series_status for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_series_status_delete_own"
  on public.user_series_status for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "episode_tracking_select_own"
  on public.episode_tracking for select
  to authenticated
  using (auth.uid() = user_id);

create policy "episode_tracking_insert_own"
  on public.episode_tracking for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "episode_tracking_delete_own"
  on public.episode_tracking for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "reviews_select_all"
  on public.reviews for select
  to authenticated
  using (true);

create policy "reviews_insert_own"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "reviews_update_own"
  on public.reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "reviews_delete_own"
  on public.reviews for delete
  to authenticated
  using (auth.uid() = user_id);
