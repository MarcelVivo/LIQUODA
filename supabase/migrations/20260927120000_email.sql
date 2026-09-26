-- LIQUODA – Etappe 8: E-Mail-Versand (Resend). Protokoll aller Mails, Sprache je Nutzer.

alter table public.users
  add column if not exists locale text not null default 'de' check (locale in ('de', 'en'));

-- Sprache aus den Registrierungs-Metadaten übernehmen
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role public.user_role;
  v_name text;
  v_locale text;
begin
  v_role := case new.raw_user_meta_data ->> 'role'
              when 'emittent' then 'emittent'::public.user_role
              else 'investor'::public.user_role
            end;
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1));
  v_locale := case new.raw_user_meta_data ->> 'locale' when 'en' then 'en' else 'de' end;

  insert into public.users (auth_id, role, name, email, locale)
  values (new.id, v_role, left(v_name, 120), new.email, v_locale);

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_role::text)
   where id = new.id;
  return new;
end;
$$;

-- Protokoll: was wurde wann an wen gesendet (kein Inhalt, nur Betreff und Ergebnis)
create table if not exists public.email_log (
  id           bigint generated always as identity primary key,
  to_email     text not null,
  template     text not null,
  subject      text not null,
  locale       text not null default 'de',
  entity       text,
  entity_id    uuid,
  provider_id  text,
  status       text not null check (status in ('sent', 'failed', 'skipped')),
  error        text,
  created_at   timestamptz not null default now()
);
create index if not exists email_log_created_idx on public.email_log (created_at desc);
create index if not exists email_log_entity_idx on public.email_log (entity, entity_id);

alter table public.email_log enable row level security;
revoke all on public.email_log from anon, authenticated;
-- Keine Policies: nur service_role liest und schreibt.
