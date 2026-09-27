-- Etappe 20: KI-Assistent für Kapitalnehmer und Support-Bot auf der Website.
-- Alle Tabellen werden nur vom Backend (service_role) beschrieben; Kapitalnehmer
-- sehen ihre eigenen Vorprüfungen über RLS.

-- Freischaltung je Projekt: durch Zahlung (CHF 190) oder manuell im Admin (Standard/Premium)
alter table public.projects
  add column if not exists ai_unlocked_at timestamptz;
comment on column public.projects.ai_unlocked_at is 'KI-Assistent freigeschaltet (Zahlung oder Paket); null = gesperrt';

-- Gesprächsverlauf des Assistenten: ein Verlauf je Projekt, Nachrichten im API-Format
create table if not exists public.ai_conversations (
  project_id  uuid primary key references public.projects (id) on delete cascade,
  messages    jsonb not null default '[]'::jsonb,
  turns       integer not null default 0,
  updated_at  timestamptz not null default now()
);
alter table public.ai_conversations enable row level security;
revoke all on public.ai_conversations from anon, authenticated;

-- Vorprüfungen: strukturierter Bericht der KI, jede Ausführung eine Zeile
create table if not exists public.ai_prechecks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  verdict     text not null check (verdict in ('ready', 'needs_work', 'not_suitable')),
  score       integer not null check (score between 0 and 100),
  result      jsonb not null,
  model       text,
  created_at  timestamptz not null default now()
);
create index if not exists ai_prechecks_project_idx on public.ai_prechecks (project_id, created_at desc);
alter table public.ai_prechecks enable row level security;
revoke insert, update, delete on public.ai_prechecks from anon, authenticated;
create policy ai_prechecks_select_own on public.ai_prechecks
  for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.emittent_id = public.my_user_id()));

-- Bestellungen der Freischaltung (Stripe Checkout, CHF 190 einmalig)
create table if not exists public.ai_orders (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  emittent_id   uuid not null references public.users (id) on delete cascade,
  provider      text not null default 'stripe',
  provider_ref  text not null unique,
  amount_chf    numeric(12, 2) not null,
  status        text not null default 'open' check (status in ('open', 'paid', 'expired', 'failed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists ai_orders_project_idx on public.ai_orders (project_id, created_at desc);
alter table public.ai_orders enable row level security;
revoke all on public.ai_orders from anon, authenticated;
create trigger ai_orders_set_updated_at before update on public.ai_orders
  for each row execute function public.set_updated_at();

-- Protokoll des Support-Bots auf der Website (anonym, Sitzung = zufällige ID im Browser)
create table if not exists public.ai_support_messages (
  id          bigint generated always as identity primary key,
  session_id  uuid not null,
  locale      text not null default 'de',
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists ai_support_messages_session_idx on public.ai_support_messages (session_id, created_at);
create index if not exists ai_support_messages_created_idx on public.ai_support_messages (created_at desc);
alter table public.ai_support_messages enable row level security;
revoke all on public.ai_support_messages from anon, authenticated;
