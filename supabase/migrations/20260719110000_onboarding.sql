alter table public.profiles add column if not exists onboarded boolean not null default false;

update public.profiles set onboarded = true where onboarded = false;
