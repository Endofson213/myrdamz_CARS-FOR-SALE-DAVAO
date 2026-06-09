create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.site_settings to service_role;

insert into public.site_settings (key, value)
values ('hero_images', '[]'::jsonb)
on conflict (key) do nothing;
