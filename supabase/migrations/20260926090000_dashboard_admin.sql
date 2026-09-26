-- LIQUODA – Etappe 5: Emittenten-Dashboard, Dokumente, Admin-Funktionen, Zeitplan
-- Ausführen mit: supabase db push

-- ---------------------------------------------------------------------------
-- Felder
-- ---------------------------------------------------------------------------
alter table public.projects add column if not exists review_note text; -- Rückfrage/Begründung von LIQUODA an den Emittenten
alter table public.audit_log add column if not exists actor_label text; -- z. B. «admin:info@liquoda.com» oder «system:cron»

-- ---------------------------------------------------------------------------
-- Audit-Log: Kennung des Handelnden aus der Sitzung übernehmen (liquoda.actor_label)
-- ---------------------------------------------------------------------------
create or replace function public.log_status_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_actor text := nullif(current_setting('liquoda.actor_label', true), '');
begin
  if tg_table_name = 'users' then
    if new.kyc_status is distinct from old.kyc_status then
      insert into public.audit_log (actor_id, actor_label, entity, entity_id, action, old_value, new_value)
      values (public.my_user_id(), v_actor, 'users', new.id, 'kyc_status', old.kyc_status::text, new.kyc_status::text);
    end if;
    if new.role is distinct from old.role then
      insert into public.audit_log (actor_id, actor_label, entity, entity_id, action, old_value, new_value)
      values (public.my_user_id(), v_actor, 'users', new.id, 'role', old.role::text, new.role::text);
    end if;
    return new;
  end if;

  if old.status::text is distinct from new.status::text then
    insert into public.audit_log (actor_id, actor_label, entity, entity_id, action, old_value, new_value)
    values (public.my_user_id(), v_actor, tg_table_name, new.id, 'status', old.status::text, new.status::text);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Emittenten dürfen nur fachliche Spalten schreiben; Summen, Zuordnung und
-- Rückfragen bleiben dem Backend vorbehalten (Spaltenrechte ergänzen RLS).
-- ---------------------------------------------------------------------------
revoke insert, update on public.projects from authenticated;
grant insert (slug, emittent_id, title, summary, description, purpose, location, risks,
              asset_type, target_amount_chf, min_investment_chf, deadline, status, token_model)
  on public.projects to authenticated;
grant update (slug, title, summary, description, purpose, location, risks,
              asset_type, target_amount_chf, min_investment_chf, deadline, status, token_model)
  on public.projects to authenticated;

-- Einreichen setzt die Rückfrage zurück
create or replace function public.clear_review_note_on_submit()
returns trigger language plpgsql as $$
begin
  if new.status = 'in_review' and old.status = 'draft' then
    new.review_note := null;
  end if;
  return new;
end;
$$;
create trigger projects_clear_review_note before update of status on public.projects
  for each row execute function public.clear_review_note_on_submit();

-- ---------------------------------------------------------------------------
-- Admin-Funktionen (nur service_role): KYC-Status, Projektstatus mit Begründung
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_kyc(p_user_id uuid, p_status public.kyc_status, p_actor text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('liquoda.actor_label', coalesce(p_actor, 'admin'), true);
  update public.users set kyc_status = p_status where id = p_user_id;
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.admin_set_project_status(
  p_project_id uuid, p_status public.project_status, p_note text, p_actor text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_old public.project_status;
begin
  perform set_config('liquoda.actor_label', coalesce(p_actor, 'admin'), true);
  select status into v_old from public.projects where id = p_project_id for update;
  if not found then
    raise exception 'project not found' using errcode = 'P0002';
  end if;
  if not (
       (v_old = 'in_review' and p_status in ('active', 'draft'))   -- Freigabe (sofort live) oder Rückfrage
    or (v_old = 'active'    and p_status in ('cancelled', 'failed'))
    or (v_old = 'draft'     and p_status = 'cancelled')
  ) then
    raise exception 'invalid project status transition % -> %', v_old, p_status using errcode = 'P0001';
  end if;
  update public.projects set status = p_status, review_note = nullif(p_note, '') where id = p_project_id;
end;
$$;

revoke execute on function public.admin_set_kyc(uuid, public.kyc_status, text) from public, anon, authenticated;
revoke execute on function public.admin_set_project_status(uuid, public.project_status, text, text) from public, anon, authenticated;
grant execute on function public.admin_set_kyc(uuid, public.kyc_status, text) to service_role;
grant execute on function public.admin_set_project_status(uuid, public.project_status, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Dokumente: privater Bucket, Zugriff ausschliesslich über das Backend (service_role)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-documents', 'project-documents', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Zeitplan: abgelaufene Runden ohne Ziel -> failed; verwaiste Reservationen -> cancelled
-- ---------------------------------------------------------------------------
create or replace function public.expire_projects()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_count integer;
begin
  perform set_config('liquoda.actor_label', 'system:cron', true);
  update public.projects
     set status = 'failed'
   where status = 'active' and deadline < current_date;
  get diagnostics v_count = row_count;
  update public.investments
     set status = 'cancelled'
   where status = 'reserved' and created_at < now() - interval '2 hours';
  return v_count;
end;
$$;
revoke execute on function public.expire_projects() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
select cron.schedule('liquoda-expire-projects', '15 0 * * *', $$select public.expire_projects()$$);
