-- LIQUODA – Absicherung für Investoren (Spec, Abschnitt 11a)
-- LIQUODA bewertet die Sicherheit nicht und gibt keine Garantie; die Felder beschreiben nur, was der Emittent stellt.

create type public.collateral_type as enum ('none', 'pledge', 'guarantee', 'milestone_payout');

alter table public.projects
  add column if not exists collateral_type public.collateral_type not null default 'none',
  add column if not exists collateral_note text check (collateral_note is null or char_length(collateral_note) <= 1000);

-- Emittenten dürfen die beiden Felder pflegen
grant insert (collateral_type, collateral_note) on public.projects to authenticated;
grant update (collateral_type, collateral_note) on public.projects to authenticated;

-- Öffentliche Projektansicht um die Felder ergänzen (neue Spalten am Ende)
create or replace view public.project_public
with (security_invoker = false) as
  select p.id, p.slug, p.title, p.summary, p.description, p.purpose, p.location, p.risks,
         p.asset_type, p.target_amount_chf, p.min_investment_chf, p.raised_amount_chf,
         p.deadline, p.status, p.token_model, p.created_at,
         u.name as issuer_name,
         p.collateral_type, p.collateral_note
    from public.projects p
    join public.users u on u.id = p.emittent_id
   where p.status in ('active', 'funded', 'failed', 'cancelled', 'closed');

grant select on public.project_public to anon, authenticated;
