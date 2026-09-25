-- LIQUODA – Investitionsprozess (Spec, Abschnitt 7), Etappe 4
-- Kapazitätsprüfung beim Reservieren, Summe bezahlter Investitionen,
-- automatischer Wechsel active -> funded bei erreichtem Ziel.

-- Obergrenze pro Beteiligung (Spec, Abschnitt 1: CHF 1'000 bis 20'000)
create or replace function public.max_investment_chf()
returns numeric language sql immutable as $$ select 20000::numeric $$;

-- Summe der Investitionen, die Kapazität belegen:
-- bezahlt/bestätigt vollständig, reserviert nur innerhalb der Checkout-Frist (1 Stunde)
create or replace function public.committed_amount_chf(p_project_id uuid)
returns numeric
language sql stable security definer set search_path = public
as $$
  select coalesce(sum(amount_chf), 0)
    from public.investments
   where project_id = p_project_id
     and (
       status in ('paid', 'confirmed')
       or (status = 'reserved' and created_at > now() - interval '1 hour')
     );
$$;

-- Prüfung beim Anlegen einer Reservation (gilt auch für das Backend)
create or replace function public.guard_new_investment()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_project public.projects%rowtype;
  v_kyc public.kyc_status;
  v_role public.user_role;
  v_open numeric;
begin
  select * into v_project from public.projects where id = new.project_id for update;
  if not found then
    raise exception 'project not found' using errcode = 'P0002';
  end if;
  if v_project.status <> 'active' then
    raise exception 'project is not open for investment' using errcode = 'P0001';
  end if;
  if v_project.deadline < current_date then
    raise exception 'project deadline has passed' using errcode = 'P0001';
  end if;

  select kyc_status, role into v_kyc, v_role from public.users where id = new.investor_id;
  if v_role is distinct from 'investor' then
    raise exception 'only investors can invest' using errcode = '42501';
  end if;
  if v_kyc is distinct from 'approved' then
    raise exception 'kyc not approved' using errcode = '42501';
  end if;

  if new.amount_chf <> trunc(new.amount_chf) then
    raise exception 'amount must be whole francs' using errcode = 'P0001';
  end if;
  if new.amount_chf < v_project.min_investment_chf or new.amount_chf > public.max_investment_chf() then
    raise exception 'amount out of range' using errcode = 'P0001';
  end if;

  v_open := v_project.target_amount_chf - public.committed_amount_chf(new.project_id);
  if new.amount_chf > v_open then
    raise exception 'amount exceeds remaining target' using errcode = 'P0001';
  end if;

  if new.status <> 'reserved' then
    raise exception 'new investments start as reserved' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger investments_guard_new before insert on public.investments
  for each row execute function public.guard_new_investment();

-- Summe bezahlter Investitionen nachführen; Ziel erreicht -> funded (Spec, Abschnitt 7)
create or replace function public.recalc_project_raised()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_project_id uuid := coalesce(new.project_id, old.project_id);
  v_raised numeric;
  v_target numeric;
  v_status public.project_status;
begin
  select coalesce(sum(amount_chf), 0) into v_raised
    from public.investments
   where project_id = v_project_id and status in ('paid', 'confirmed');

  update public.projects
     set raised_amount_chf = v_raised
   where id = v_project_id
  returning target_amount_chf, status into v_target, v_status;

  if v_status = 'active' and v_raised >= v_target then
    update public.projects set status = 'funded' where id = v_project_id;
  end if;
  return null;
end;
$$;

create trigger investments_recalc_raised after insert or update of status, amount_chf or delete on public.investments
  for each row execute function public.recalc_project_raised();

-- Erlaubte Statuswechsel einer Investition (nur Backend/Admin schreiben, aber sauber halten)
create or replace function public.guard_investment_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if not (
       (old.status = 'reserved'  and new.status in ('paid', 'cancelled'))
    or (old.status = 'paid'      and new.status in ('confirmed', 'refunded'))
    or (old.status = 'confirmed' and new.status = 'refunded')
  ) then
    raise exception 'invalid investment status transition % -> %', old.status, new.status using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger investments_guard_status before update of status on public.investments
  for each row execute function public.guard_investment_status();

-- Zahlungsreferenzen: Status-Werte des Anbieters, Index für Webhook-Idempotenz
alter table public.payment_references
  add column if not exists updated_at timestamptz not null default now();
create trigger payment_references_set_updated_at before update on public.payment_references
  for each row execute function public.set_updated_at();
