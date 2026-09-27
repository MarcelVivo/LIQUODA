-- Admin-Passwort in der Datenbank (gehasht), damit es per E-Mail zurückgesetzt werden kann.
-- Solange keine Zeile existiert, gilt ADMIN_EMAIL/ADMIN_PASSWORD aus den Umgebungsvariablen.
create table if not exists public.admin_accounts (
  email             text primary key,
  password_hash     text,                 -- scrypt: salt$hash (hex)
  reset_token_hash  text,                 -- sha256 des einmaligen Tokens
  reset_expires_at  timestamptz,
  updated_at        timestamptz not null default now()
);
alter table public.admin_accounts enable row level security;
revoke all on public.admin_accounts from anon, authenticated;
-- keine Policies: nur service_role
