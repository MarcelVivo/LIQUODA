create or replace view public.project_public
with (security_invoker = false) as
  select p.id, p.slug, p.title, p.summary, p.description, p.purpose, p.location, p.risks,
         p.asset_type, p.target_amount_chf, p.min_investment_chf, p.raised_amount_chf,
         p.deadline, p.status, p.token_model, p.created_at,
         u.name as issuer_name,
         p.collateral_type, p.collateral_note,
         p.token_contract_address, p.token_chain_id, p.token_symbol,
         p.cover_image_path, p.gallery_paths, u.avatar_path as issuer_avatar_path,
         u.profile_slug as issuer_slug
    from public.projects p
    join public.users u on u.id = p.emittent_id
   where p.status in ('active', 'funded', 'failed', 'cancelled', 'closed');
grant select on public.project_public to anon, authenticated;
