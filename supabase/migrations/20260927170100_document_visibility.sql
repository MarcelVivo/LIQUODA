alter table public.documents
  add column if not exists visibility text not null default 'members' check (visibility in ('public', 'members')),
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;
comment on column public.documents.visibility is 'public: für alle Besucher herunterladbar; members: nur für angemeldete Nutzer';
comment on column public.documents.reviewed_at is 'Von LIQUODA gesichtet (keine Prüfung auf Richtigkeit)';
