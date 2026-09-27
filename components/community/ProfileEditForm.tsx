'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { InputField, TextareaField } from '@/components/ui/Field';

export default function ProfileEditForm({ bio, website, profileUrl }: { bio: { de: string; en: string }; website: string; profileUrl: string | null }) {
  const t = useTranslations('community.profileEdit');
  const router = useRouter();
  const [form, setForm] = useState({ bioDe: bio.de, bioEn: bio.en, website });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    setSaved(false);
    const res = await fetch('/api/emittent/profil', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bio: { de: form.bioDe, en: form.bioEn }, website: form.website }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(t(data.fields?.includes('website') ? 'errors.website' : 'errors.server'));
    setSaved(true);
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate className="liq-card space-y-4 p-6 sm:p-8">
      <TextareaField label={t('bioDe')} hint={t('bioHint')} textareaProps={{ id: 'p-bioDe', value: form.bioDe, maxLength: 1500, onChange: (e) => setForm({ ...form, bioDe: e.target.value }) }} />
      <TextareaField label={t('bioEn')} textareaProps={{ id: 'p-bioEn', value: form.bioEn, maxLength: 1500, onChange: (e) => setForm({ ...form, bioEn: e.target.value }) }} />
      <InputField label={t('website')} hint={t('websiteHint')} error={error} inputProps={{ id: 'p-web', type: 'url', value: form.website, placeholder: 'https://', onChange: (e) => setForm({ ...form, website: e.target.value }) }} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? t('saving') : t('save')}</Button>
        {saved && <span className="text-xs text-accent">{t('saved')}</span>}
      </div>
      {profileUrl && (
        <p className="text-xs text-muted">
          {t('link')}: <a href={profileUrl} target="_blank" rel="noopener" className="liq-link font-mono">{profileUrl}</a>
        </p>
      )}
    </form>
  );
}
