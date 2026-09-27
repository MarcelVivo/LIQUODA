'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { InputField } from '@/components/ui/Field';

export default function NewPasswordForm({ home }: { home: string }) {
  const t = useTranslations('auth.newPassword');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError(t('errors.length'));
    if (password !== password2) return setError(t('errors.mismatch'));
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch('/api/konto/passwort-neu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(t(data.error === 'session' ? 'errors.session' : 'errors.server'));
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push(home);
        router.refresh();
      }, 1500);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="liq-card p-8" role="status">
        <CheckCircle size={40} className="text-accent" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="mt-4 text-xl font-bold text-navy">{t('doneTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t('doneText')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="liq-card p-6 sm:p-8">
      <InputField label={t('password')} inputProps={{ id: 'np-1', type: 'password', value: password, autoComplete: 'new-password', onChange: (e) => setPassword(e.target.value) }} />
      <div className="mt-4">
        <InputField label={t('password2')} error={error} inputProps={{ id: 'np-2', type: 'password', value: password2, autoComplete: 'new-password', onChange: (e) => setPassword2(e.target.value) }} />
      </div>
      <div className="mt-6">
        <Button type="submit" size="lg" fullWidth disabled={busy}>{busy ? t('submitting') : t('submit')}</Button>
      </div>
    </form>
  );
}
