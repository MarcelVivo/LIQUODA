-- LIQUODA – Etappe 9: Rückabwicklung (Spec, Abschnitt 7: Projekt failed -> Investitionen refunded)

alter table public.investments
  add column if not exists refund_status text check (refund_status in ('pending', 'done', 'failed')),
  add column if not exists refund_error text,
  add column if not exists refunded_at timestamptz;

-- Backend: Investition als rückerstattet markieren (paid/confirmed -> refunded), mit Kennung im Audit-Log
create or replace function public.backend_refund_investment(
  p_investment_id uuid, p_provider_ref text, p_amount_chf numeric, p_actor text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('liquoda.actor_label', coalesce(p_actor, 'backend'), true);
  insert into public.payment_references (investment_id, provider, provider_ref, status, amount_chf)
  values (p_investment_id, 'stripe_refund', p_provider_ref, 'refunded', p_amount_chf)
  on conflict (provider, provider_ref) do nothing;
  update public.investments
     set status = 'refunded', refund_status = 'done', refund_error = null, refunded_at = now()
   where id = p_investment_id and status in ('paid', 'confirmed');
  if not found then
    raise exception 'investment not refundable' using errcode = 'P0001';
  end if;
end;
$$;
revoke execute on function public.backend_refund_investment(uuid, text, numeric, text) from public, anon, authenticated;
grant execute on function public.backend_refund_investment(uuid, text, numeric, text) to service_role;

-- Fehlgeschlagene Rückerstattung festhalten (für Wiederholung im Admin und im Tageslauf)
create or replace function public.backend_refund_failed(p_investment_id uuid, p_error text)
returns void
language sql security definer set search_path = public
as $$
  update public.investments set refund_status = 'failed', refund_error = left(p_error, 500) where id = p_investment_id;
$$;
revoke execute on function public.backend_refund_failed(uuid, text) from public, anon, authenticated;
grant execute on function public.backend_refund_failed(uuid, text) to service_role;

-- Bezahlte Investitionen zählen nicht mehr zur Summe, sobald sie rückerstattet sind (recalc trigger nutzt paid/confirmed)
-- Übersicht für den Tageslauf: Projekte, deren Runde gescheitert/beendet ist und die noch offene Zahlungen haben
create or replace view public.refund_backlog
with (security_invoker = false) as
  select i.id as investment_id, i.project_id, i.status as investment_status, i.refund_status, p.status as project_status
    from public.investments i
    join public.projects p on p.id = i.project_id
   where p.status in ('failed', 'cancelled')
     and i.status in ('paid', 'confirmed');
revoke all on public.refund_backlog from anon, authenticated;
