#!/usr/bin/env node
/**
 * Erzeugt supabase/seed.sql aus lib/projects/example-data.ts.
 * Aufruf: npm run seed:generate
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const build = fs.mkdtempSync(path.join(os.tmpdir(), 'liquoda-seed-'));
execSync(
  `npx tsc lib/projects/example-data.ts lib/projects/types.ts --outDir "${build}" --module commonjs --target es2020 --skipLibCheck --esModuleInterop`,
  { cwd: root, stdio: 'ignore' }
);
const { exampleProjects } = require(path.join(build, 'example-data.js'));

const q = (v) => "'" + String(v).replace(/'/g, "''") + "'";
const j = (v) => q(JSON.stringify(v)) + '::jsonb';

let out = `-- LIQUODA – Beispieldaten für den Marktplatz
-- Erzeugt aus lib/projects/example-data.ts (npm run seed:generate). Idempotent: bestehende Einträge werden übersprungen.
-- Ausführen: supabase db push --include-seed   (oder Inhalt im SQL-Editor ausführen)
--
-- Für jedes Projekt wird ein Demo-Emittent in auth.users angelegt (bestätigt, zufälliges
-- Passwort, kein Login möglich). Der Trigger handle_new_user legt das Profil in public.users an.

do $$
declare
  v_auth uuid;
  v_user uuid;
begin
`;
exampleProjects.forEach((p, i) => {
  const authId = `a0000000-0000-4000-8000-00000000000${i + 1}`;
  const email = `demo-emittent-${i + 1}@liquoda.example`;
  out += `
  -- ${p.title.de}
  v_auth := '${authId}';
  if not exists (select 1 from auth.users where id = v_auth) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_auth, 'authenticated', 'authenticated',
      ${q(email)}, extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      ${j({ name: p.issuerName, role: 'emittent' })}, now(), now(), '', '', '', ''
    );
  end if;
  select id into v_user from public.users where auth_id = v_auth;

  if not exists (select 1 from public.projects where slug = ${q(p.slug)}) then
    insert into public.projects (
      slug, emittent_id, title, summary, description, purpose, location, risks,
      asset_type, target_amount_chf, min_investment_chf, raised_amount_chf, deadline, status, token_model,
      collateral_type, collateral_note
    ) values (
      ${q(p.slug)}, v_user, ${j(p.title)}, ${j(p.summary)},
      ${j({ de: p.description.map((d) => d.de), en: p.description.map((d) => d.en) })},
      ${j(p.purpose)}, ${j(p.location)},
      ${j({ de: p.risks.map((r) => r.de), en: p.risks.map((r) => r.en) })},
      ${q(p.assetType)}, ${p.targetAmountChf}, ${p.minInvestmentChf}, ${p.raisedAmountChf},
      ${q(p.deadline)}, ${q(p.status)}, ${q(p.tokenModel)},
      ${q(p.collateralType || 'none')}, ${p.collateralNote ? q(p.collateralNote) : 'null'}
    );
    insert into public.documents (project_id, type, title, version, created_at)
    select id, d.type::public.document_type, d.title, d.version, d.created_at
      from public.projects, (values
${p.documents.map((d) => `        (${q(d.type)}, ${j(d.title)}, ${d.version}, ${q(d.date + 'T12:00:00Z')}::timestamptz)`).join(',\n')}
      ) as d(type, title, version, created_at)
     where slug = ${q(p.slug)};
  end if;
`;
});
out += `end $$;\n`;
fs.writeFileSync(path.join(root, 'supabase', 'seed.sql'), out);
fs.rmSync(build, { recursive: true, force: true });
console.log(`supabase/seed.sql geschrieben (${exampleProjects.length} Projekte)`);
