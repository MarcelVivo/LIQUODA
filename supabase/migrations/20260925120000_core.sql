-- LIQUODA – Datenmodell (Spec, Abschnitt 6) mit Row Level Security (Spec, Abschnitt 5 und 9)
-- Etappe 3. Ausführen mit: supabase db push

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('investor', 'emittent', 'admin');
create type public.kyc_status as enum ('pending', 'approved', 'rejected');
create type public.asset_type as enum ('company', 'real_estate', 'energy', 'collectible');
create type public.project_status as enum (
  'draft', 'in_review', 'approved', 'active', 'funded', 'failed', 'cancelled', 'closed'
);
create type public.token_model as enum ('erc20', 'erc721', 'erc1155');
create type public.investment_status as enum ('reserved', 'paid', 'confirmed', 'cancelled', 'refunded');
create type public.document_type as enum ('contract', 'prospectus', 'valuation', 'financials', 'other');

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------
create table public.users (
  id              uuid primary key default gen_random_uuid(),
  auth_id         uuid not null unique references auth.users (id) on delete cascade,
  role            public.user_role not null default 'investor',
  name            text not null check (char_length(name) between 1 and 120),
  email           text not null check (char_length(email) <= 254),
  kyc_status      public.kyc_status not null default 'pending',
  wallet_address  text check (wallet_address is null or wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
  created_at      timestamptz not null default now()
);
comment on table public.users is 'Nutzerprofile. Rolle und KYC-Status werden serverseitig gesetzt.';

-- Mehrsprachige Texte liegen als jsonb {"de": ..., "en": ...} vor; «de» ist Pflicht.
create table public.projects (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  emittent_id         uuid not null references public.users (id) on delete restrict,
  title               jsonb not null check (title ? 'de'),
  summary             jsonb not null check (summary ? 'de'),
  description         jsonb not null check (description ? 'de'),   -- {"de": [Absätze], "en": [Absätze]}
  purpose             jsonb not null check (purpose ? 'de'),
  location            jsonb not null check (location ? 'de'),
  risks               jsonb not null default '{"de": [], "en": []}'::jsonb,
  asset_type          public.asset_type not null,
  target_amount_chf   numeric(14, 2) not null check (target_amount_chf > 0),
  min_investment_chf  numeric(14, 2) not null check (min_investment_chf > 0),
  raised_amount_chf   numeric(14, 2) not null default 0 check (raised_amount_chf >= 0),
  deadline            date not null,
  status              public.project_status not null default 'draft',
  token_model         public.token_model not null default 'erc20',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on column public.projects.raised_amount_chf is 'Summe bezahlter/bestätigter Investitionen. Ab Etappe 4 per Trigger gepflegt.';
create index projects_status_idx on public.projects (status);
create index projects_emittent_idx on public.projects (emittent_id);

create table public.investments (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete restrict,
  investor_id  uuid not null references public.users (id) on delete restrict,
  amount_chf   numeric(14, 2) not null check (amount_chf > 0),
  status       public.investment_status not null default 'reserved',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index investments_project_idx on public.investments (project_id);
create index investments_investor_idx on public.investments (investor_id);

create table public.documents (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  investment_id  uuid references public.investments (id) on delete cascade,
  type           public.document_type not null default 'other',
  title          jsonb not null check (title ? 'de'),
  storage_path   text,
  version        integer not null default 1 check (version >= 1),
  sha256_hash    text check (sha256_hash is null or sha256_hash ~ '^[0-9a-f]{64}$'),
  created_at     timestamptz not null default now()
);
create index documents_project_idx on public.documents (project_id);
create index documents_investment_idx on public.documents (investment_id);

create table public.token_references (
  id                uuid primary key default gen_random_uuid(),
  investment_id     uuid not null unique references public.investments (id) on delete restrict,
  contract_address  text not null check (contract_address ~ '^0x[0-9a-fA-F]{40}$'),
  token_id          text,
  token_amount      numeric(36, 0) not null check (token_amount > 0),
  tx_hash           text not null check (tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  created_at        timestamptz not null default now()
);

create table public.payment_references (
  id             uuid primary key default gen_random_uuid(),
  investment_id  uuid not null references public.investments (id) on delete restrict,
  provider       text not null,
  provider_ref   text not null,
  status         text not null,
  amount_chf     numeric(14, 2) not null check (amount_chf > 0),
  created_at     timestamptz not null default now(),
  unique (provider, provider_ref)
);
create index payment_references_investment_idx on public.payment_references (investment_id);

create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.users (id) on delete set null,
  entity      text not null,
  entity_id   uuid not null,
  action      text not null,
  old_value   text,
  new_value   text,
  created_at  timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen für RLS (security definer, damit keine Rekursion auf users)
-- ---------------------------------------------------------------------------
create or replace function public.my_user_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.users where auth_id = auth.uid();
$$;

create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.users where auth_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from public.users where auth_id = auth.uid()), false);
$$;

revoke execute on function public.my_user_id(), public.my_role(), public.is_admin() from public;
grant execute on function public.my_user_id(), public.my_role(), public.is_admin() to authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- Registrierung: auth.users -> public.users (Rolle aus Metadaten, nur investor|emittent)
-- Die Rolle wird zusätzlich in app_metadata gespiegelt, damit sie im JWT steht
-- (Middleware liest sie ohne Datenbankzugriff). app_metadata ist nicht durch Nutzer änderbar.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role public.user_role;
  v_name text;
begin
  v_role := case new.raw_user_meta_data ->> 'role'
              when 'emittent' then 'emittent'::public.user_role
              else 'investor'::public.user_role
            end;
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1));

  insert into public.users (auth_id, role, name, email)
  values (new.id, v_role, left(v_name, 120), new.email);

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_role::text)
   where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rollenwechsel (nur Admin/Backend) in app_metadata nachführen
create or replace function public.sync_role_to_auth()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    update auth.users
       set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role::text)
     where id = new.auth_id;
  end if;
  return new;
end;
$$;

create trigger users_sync_role
  after update of role on public.users
  for each row execute function public.sync_role_to_auth();

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger investments_set_updated_at before update on public.investments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit-Log: jede Statusänderung wird protokolliert (Spec, Abschnitt 6 und 7)
-- ---------------------------------------------------------------------------
create or replace function public.log_status_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_old text;
  v_new text;
  v_action text;
begin
  if tg_table_name = 'users' then
    if new.kyc_status is distinct from old.kyc_status then
      insert into public.audit_log (actor_id, entity, entity_id, action, old_value, new_value)
      values (public.my_user_id(), 'users', new.id, 'kyc_status', old.kyc_status::text, new.kyc_status::text);
    end if;
    if new.role is distinct from old.role then
      insert into public.audit_log (actor_id, entity, entity_id, action, old_value, new_value)
      values (public.my_user_id(), 'users', new.id, 'role', old.role::text, new.role::text);
    end if;
    return new;
  end if;

  v_old := old.status::text;
  v_new := new.status::text;
  if v_old is distinct from v_new then
    v_action := 'status';
    insert into public.audit_log (actor_id, entity, entity_id, action, old_value, new_value)
    values (public.my_user_id(), tg_table_name, new.id, v_action, v_old, v_new);
  end if;
  return new;
end;
$$;

create trigger projects_audit after update on public.projects
  for each row execute function public.log_status_change();
create trigger investments_audit after update on public.investments
  for each row execute function public.log_status_change();
create trigger users_audit after update on public.users
  for each row execute function public.log_status_change();

-- ---------------------------------------------------------------------------
-- Statuswächter: Emittenten dürfen ihr Projekt nur als draft oder in_review setzen.
-- Freigabe (approved/active) und alle weiteren Wechsel nur durch Admin oder Backend.
-- ---------------------------------------------------------------------------
create or replace function public.guard_project_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- Backend (service_role, kein auth.uid()) und Admin dürfen alles
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.status not in ('draft', 'in_review') then
    raise exception 'status % requires approval by LIQUODA', new.status using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    if old.status not in ('draft', 'in_review') then
      raise exception 'project is no longer editable' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger projects_guard_status before insert or update on public.projects
  for each row execute function public.guard_project_status();

-- ---------------------------------------------------------------------------
-- Öffentliche Projektansicht für den Marktplatz (inkl. Emittentenname, ohne Personendaten)
-- ---------------------------------------------------------------------------
create view public.project_public
with (security_invoker = false) as
  select p.id, p.slug, p.title, p.summary, p.description, p.purpose, p.location, p.risks,
         p.asset_type, p.target_amount_chf, p.min_investment_chf, p.raised_amount_chf,
         p.deadline, p.status, p.token_model, p.created_at,
         u.name as issuer_name
    from public.projects p
    join public.users u on u.id = p.emittent_id
   where p.status in ('active', 'funded', 'failed', 'cancelled', 'closed');

grant select on public.project_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users              enable row level security;
alter table public.projects           enable row level security;
alter table public.investments        enable row level security;
alter table public.documents          enable row level security;
alter table public.token_references   enable row level security;
alter table public.payment_references enable row level security;
alter table public.audit_log          enable row level security;

-- users: eigenes Profil lesen; nur name und wallet_address selbst ändern; Admin alles
revoke insert, update, delete on public.users from anon, authenticated;
grant update (name, wallet_address) on public.users to authenticated;

create policy users_select_own on public.users
  for select to authenticated using (auth_id = auth.uid() or public.is_admin());
create policy users_update_own on public.users
  for update to authenticated using (auth_id = auth.uid() or public.is_admin())
  with check (auth_id = auth.uid() or public.is_admin());

-- projects: öffentlich nur aktive/abgeschlossene; Emittent eigene; Admin alles
create policy projects_select_public on public.projects
  for select to anon, authenticated
  using (status in ('active', 'funded', 'failed', 'cancelled', 'closed'));
create policy projects_select_own on public.projects
  for select to authenticated
  using (emittent_id = public.my_user_id() or public.is_admin());
create policy projects_insert_own on public.projects
  for insert to authenticated
  with check (
    public.is_admin()
    or (emittent_id = public.my_user_id() and public.my_role() = 'emittent')
  );
create policy projects_update_own on public.projects
  for update to authenticated
  using (public.is_admin() or emittent_id = public.my_user_id())
  with check (public.is_admin() or emittent_id = public.my_user_id());
create policy projects_delete_admin on public.projects
  for delete to authenticated using (public.is_admin());

-- investments: Investor eigene; Emittent die seiner Projekte (lesend); Admin alles
create policy investments_select on public.investments
  for select to authenticated
  using (
    investor_id = public.my_user_id()
    or public.is_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.emittent_id = public.my_user_id())
  );
create policy investments_insert_own on public.investments
  for insert to authenticated
  with check (investor_id = public.my_user_id() and status = 'reserved' and public.my_role() = 'investor');
-- Statuswechsel nur durch Backend (service_role) oder Admin
create policy investments_update_admin on public.investments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- documents: sichtbar bei öffentlichen Projekten, eigenen Investitionen, eigenen Projekten; Admin alles
create policy documents_select on public.documents
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
       where p.id = project_id
         and (
           (investment_id is null and p.status in ('active', 'funded', 'failed', 'cancelled', 'closed'))
           or p.emittent_id = public.my_user_id()
         )
    )
    or exists (select 1 from public.investments i where i.id = investment_id and i.investor_id = public.my_user_id())
  );
create policy documents_insert_own_project on public.documents
  for insert to authenticated
  with check (
    public.is_admin()
    or (investment_id is null and exists (
      select 1 from public.projects p
       where p.id = project_id and p.emittent_id = public.my_user_id() and p.status in ('draft', 'in_review')
    ))
  );
create policy documents_delete_own_project on public.documents
  for delete to authenticated
  using (
    public.is_admin()
    or (investment_id is null and exists (
      select 1 from public.projects p
       where p.id = project_id and p.emittent_id = public.my_user_id() and p.status in ('draft', 'in_review')
    ))
  );

-- token_references / payment_references: lesend für die eigene Investition; Schreiben nur Backend
create policy token_references_select on public.token_references
  for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.investments i where i.id = investment_id and i.investor_id = public.my_user_id())
  );
create policy payment_references_select on public.payment_references
  for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.investments i where i.id = investment_id and i.investor_id = public.my_user_id())
  );

-- audit_log: nur Admin lesend; Einträge entstehen ausschliesslich über Trigger
create policy audit_log_select_admin on public.audit_log
  for select to authenticated using (public.is_admin());
revoke insert, update, delete on public.audit_log from anon, authenticated;
