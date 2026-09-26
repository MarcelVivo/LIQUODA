-- Backend-Funktion: Vertragsdaten am Projekt speichern, Kennung im Audit-Log (Trigger projects_audit_token)
create or replace function public.backend_set_project_token(
  p_project_id uuid, p_address text, p_chain_id integer, p_symbol text, p_tx text, p_actor text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('liquoda.actor_label', coalesce(p_actor, 'backend'), true);
  update public.projects
     set token_contract_address = p_address,
         token_chain_id = p_chain_id,
         token_symbol = p_symbol,
         token_deploy_tx = p_tx,
         token_deployed_at = now()
   where id = p_project_id and token_contract_address is null;
  if not found then
    raise exception 'project not found or contract already set' using errcode = 'P0001';
  end if;
end;
$$;
revoke execute on function public.backend_set_project_token(uuid, text, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.backend_set_project_token(uuid, text, integer, text, text, text) to service_role;
