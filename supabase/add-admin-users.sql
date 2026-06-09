create table if not exists public.admin_users (
  id uuid primary key,
  username text not null unique check (username = lower(username)),
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.admin_users to service_role;

create table if not exists public.admin_login_attempts (
  identifier text primary key,
  attempts integer not null default 0,
  window_started timestamptz not null default now(),
  blocked_until timestamptz
);

alter table public.admin_login_attempts enable row level security;

grant select, insert, update, delete on table public.admin_login_attempts to service_role;
