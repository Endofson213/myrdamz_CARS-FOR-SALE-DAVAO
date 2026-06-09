create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

insert into public.site_settings (key, value)
values ('hero_images', '[]'::jsonb)
on conflict (key) do nothing;
