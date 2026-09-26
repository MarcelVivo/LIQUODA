-- LIQUODA – Etappe 6: Token-Verträge, Wallet-Verknüpfung, Mint-Referenzen (Spec, Abschnitt 5, 7 und 8)

-- Projekt: ein Vertrag pro Projekt (ERC-20, 1 Token = CHF 1, Cap = Zielbetrag)
alter table public.projects
  add column if not exists token_contract_address text check (token_contract_address is null or token_contract_address ~ '^0x[0-9a-fA-F]{40}$'),
  add column if not exists token_chain_id integer,
  add column if not exists token_symbol text,
  add column if not exists token_deploy_tx text check (token_deploy_tx is null or token_deploy_tx ~ '^0x[0-9a-fA-F]{64}$'),
  add column if not exists token_deployed_at timestamptz;

-- Nutzer: Nonce für die Signaturprüfung, Zeitpunkt der Verknüpfung
alter table public.users
  add column if not exists wallet_nonce text,
  add column if not exists wallet_linked_at timestamptz;

-- Dokumente: Transaktion, mit der der SHA-256-Hash on-chain verankert wurde
alter table public.documents
  add column if not exists onchain_tx text check (onchain_tx is null or onchain_tx ~ '^0x[0-9a-fA-F]{64}$');

-- Wallet-Adresse wird nur über das Backend nach Signaturprüfung gesetzt
revoke update (wallet_address) on public.users from authenticated;

-- Audit: Wallet-Verknüpfung protokollieren
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
    if new.wallet_address is distinct from old.wallet_address then
      insert into public.audit_log (actor_id, actor_label, entity, entity_id, action, old_value, new_value)
      values (public.my_user_id(), v_actor, 'users', new.id, 'wallet_address', old.wallet_address, new.wallet_address);
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

-- Vertragsanlage protokollieren
create or replace function public.log_token_deploy()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.token_contract_address is distinct from old.token_contract_address then
    insert into public.audit_log (actor_id, actor_label, entity, entity_id, action, old_value, new_value)
    values (public.my_user_id(), nullif(current_setting('liquoda.actor_label', true), ''), 'projects', new.id, 'token_contract', old.token_contract_address, new.token_contract_address);
  end if;
  return new;
end;
$$;
create trigger projects_audit_token after update of token_contract_address on public.projects
  for each row execute function public.log_token_deploy();

-- Backend-Funktion: Token-Referenz speichern und Investition bestätigen (paid -> confirmed)
create or replace function public.backend_confirm_investment(
  p_investment_id uuid, p_contract text, p_token_amount numeric, p_tx_hash text, p_actor text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('liquoda.actor_label', coalesce(p_actor, 'backend'), true);
  insert into public.token_references (investment_id, contract_address, token_amount, tx_hash)
  values (p_investment_id, p_contract, p_token_amount, p_tx_hash);
  update public.investments set status = 'confirmed' where id = p_investment_id and status = 'paid';
  if not found then
    raise exception 'investment not in status paid' using errcode = 'P0001';
  end if;
end;
$$;
revoke execute on function public.backend_confirm_investment(uuid, text, numeric, text, text) from public, anon, authenticated;
grant execute on function public.backend_confirm_investment(uuid, text, numeric, text, text) to service_role;

-- Öffentliche Ansicht: Vertragsadresse sichtbar (kein Personenbezug)
create or replace view public.project_public
with (security_invoker = false) as
  select p.id, p.slug, p.title, p.summary, p.description, p.purpose, p.location, p.risks,
         p.asset_type, p.target_amount_chf, p.min_investment_chf, p.raised_amount_chf,
         p.deadline, p.status, p.token_model, p.created_at,
         u.name as issuer_name,
         p.collateral_type, p.collateral_note,
         p.token_contract_address, p.token_chain_id, p.token_symbol
    from public.projects p
    join public.users u on u.id = p.emittent_id
   where p.status in ('active', 'funded', 'failed', 'cancelled', 'closed');
grant select on public.project_public to anon, authenticated;
