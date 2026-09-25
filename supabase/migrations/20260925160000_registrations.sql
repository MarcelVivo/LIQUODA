-- Warteliste (Pre-Registrierung), bestand bereits im alten Projekt.
-- Geschrieben nur vom Backend (/api/register, Service-Role), gelesen nur im Admin-Bereich.

create table if not exists public.registrations (
  id          uuid primary key default gen_random_uuid(),
  role        text not null check (role in ('Emittent', 'Investor')),
  first_name  text not null check (char_length(first_name) between 1 and 120),
  last_name   text not null check (char_length(last_name) between 1 and 120),
  email       text not null check (char_length(email) <= 254),
  created_at  timestamptz not null default now()
);
create index if not exists registrations_created_idx on public.registrations (created_at desc);
create unique index if not exists registrations_email_role_idx on public.registrations (lower(email), role);

alter table public.registrations enable row level security;
-- Keine Policies: anon und authenticated haben keinen Zugriff; nur service_role.
revoke all on public.registrations from anon, authenticated;
