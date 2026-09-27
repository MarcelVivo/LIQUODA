-- LIQUODA – Etappe 14: Emittenten-Profil, Projekt-Neuigkeiten, Fragen und Antworten

-- ---------------------------------------------------------------------------
-- Emittenten-Profil (öffentlich): Slug, Beschreibung, Website
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists profile_slug text unique,
  add column if not exists bio jsonb,
  add column if not exists website text check (website is null or website ~ '^https?://');

grant update (bio, website) on public.users to authenticated;

create or replace function public.slugify(p_text text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(translate(coalesce(p_text, ''), 'äöüÄÖÜß', 'aouaous')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.ensure_profile_slug()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_base text; v_slug text; v_n int := 0;
begin
  if new.role <> 'emittent' or new.profile_slug is not null then return new; end if;
  v_base := left(coalesce(nullif(public.slugify(new.name), ''), 'emittent'), 60);
  v_slug := v_base;
  while exists (select 1 from public.users where profile_slug = v_slug and id <> new.id) loop
    v_n := v_n + 1; v_slug := v_base || '-' || v_n;
  end loop;
  new.profile_slug := v_slug;
  return new;
end;
$$;
create trigger users_profile_slug before insert or update of role, name on public.users
  for each row execute function public.ensure_profile_slug();

-- Bestehende Emittenten nachziehen
update public.users set name = name where role = 'emittent' and profile_slug is null;

create or replace view public.emittent_public
with (security_invoker = false) as
  select u.id, u.profile_slug, u.name, u.avatar_path, u.bio, u.website,
         (u.kyc_status = 'approved') as verified, u.created_at
    from public.users u
   where u.role = 'emittent'
     and exists (select 1 from public.projects p where p.emittent_id = u.id and p.status in ('active', 'funded', 'failed', 'cancelled', 'closed'));
grant select on public.emittent_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Projekt-Neuigkeiten (Emittent an Investoren)
-- ---------------------------------------------------------------------------
create table if not exists public.project_updates (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       jsonb not null check (title ? 'de'),
  body        jsonb not null check (body ? 'de'),
  hidden      boolean not null default false,   -- Moderation durch LIQUODA
  created_at  timestamptz not null default now()
);
create index if not exists project_updates_project_idx on public.project_updates (project_id, created_at desc);
alter table public.project_updates enable row level security;

create policy project_updates_select_public on public.project_updates
  for select to anon, authenticated
  using (
    not hidden
    and exists (select 1 from public.projects p where p.id = project_id and p.status in ('active', 'funded', 'failed', 'cancelled', 'closed'))
  );
create policy project_updates_select_own on public.project_updates
  for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.emittent_id = public.my_user_id()));
create policy project_updates_insert_own on public.project_updates
  for insert to authenticated
  with check (exists (
    select 1 from public.projects p
     where p.id = project_id and p.emittent_id = public.my_user_id()
       and p.status in ('active', 'funded', 'failed', 'cancelled', 'closed')
  ));
create policy project_updates_delete_own on public.project_updates
  for delete to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.emittent_id = public.my_user_id()));
revoke update on public.project_updates from authenticated; -- Verstecken nur durch Admin (service_role)

-- ---------------------------------------------------------------------------
-- Fragen und Antworten (Investor fragt, Emittent antwortet, LIQUODA sieht mit)
-- ---------------------------------------------------------------------------
create table if not exists public.project_questions (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  investor_id  uuid not null references public.users (id) on delete cascade,
  question     text not null check (char_length(question) between 10 and 1000),
  answer       text check (answer is null or char_length(answer) <= 2000),
  answered_at  timestamptz,
  hidden       boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists project_questions_project_idx on public.project_questions (project_id, created_at desc);
alter table public.project_questions enable row level security;

-- Öffentlich: nur beantwortete, nicht versteckte Fragen (ohne Investor-Bezug in der Anzeige)
create policy project_questions_select_public on public.project_questions
  for select to anon, authenticated
  using (
    answer is not null and not hidden
    and exists (select 1 from public.projects p where p.id = project_id and p.status in ('active', 'funded', 'failed', 'cancelled', 'closed'))
  );
create policy project_questions_select_own on public.project_questions
  for select to authenticated
  using (
    investor_id = public.my_user_id()
    or exists (select 1 from public.projects p where p.id = project_id and p.emittent_id = public.my_user_id())
  );
create policy project_questions_insert_investor on public.project_questions
  for insert to authenticated
  with check (
    investor_id = public.my_user_id() and public.my_role() = 'investor'
    and exists (select 1 from public.projects p where p.id = project_id and p.status in ('active', 'funded'))
  );
-- Antworten: nur der Emittent des Projekts, nur die Spalten answer/answered_at
revoke update on public.project_questions from authenticated;
grant update (answer, answered_at) on public.project_questions to authenticated;
create policy project_questions_answer_own on public.project_questions
  for update to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.emittent_id = public.my_user_id()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.emittent_id = public.my_user_id()));

-- Investor-ID darf öffentlich nicht sichtbar sein: Spaltenrecht für anon entziehen
revoke select on public.project_questions from anon;
grant select (id, project_id, question, answer, answered_at, created_at) on public.project_questions to anon;
