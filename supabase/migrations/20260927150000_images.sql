-- LIQUODA – Etappe 13: Projektbilder (Titelbild Pflicht, Galerie) und Emittenten-Bild (freiwillig)

alter table public.projects
  add column if not exists cover_image_path text,
  add column if not exists gallery_paths text[] not null default '{}';

alter table public.users
  add column if not exists avatar_path text;

-- Emittenten dürfen Bildpfade über das Backend setzen (Spaltenrechte für den Session-Client)
grant update (cover_image_path, gallery_paths) on public.projects to authenticated;
grant insert (cover_image_path, gallery_paths) on public.projects to authenticated;

-- Öffentlicher Bucket (nur Lesen); Schreiben ausschliesslich über das Backend (service_role)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Öffentliche Ansicht um Bilder und Emittenten-Bild ergänzen
create or replace view public.project_public
with (security_invoker = false) as
  select p.id, p.slug, p.title, p.summary, p.description, p.purpose, p.location, p.risks,
         p.asset_type, p.target_amount_chf, p.min_investment_chf, p.raised_amount_chf,
         p.deadline, p.status, p.token_model, p.created_at,
         u.name as issuer_name,
         p.collateral_type, p.collateral_note,
         p.token_contract_address, p.token_chain_id, p.token_symbol,
         p.cover_image_path, p.gallery_paths, u.avatar_path as issuer_avatar_path
    from public.projects p
    join public.users u on u.id = p.emittent_id
   where p.status in ('active', 'funded', 'failed', 'cancelled', 'closed');
grant select on public.project_public to anon, authenticated;
