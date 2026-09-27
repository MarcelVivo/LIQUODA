'use client';

import { useState, FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MailCheck } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Button from '@/components/ui/Button';
import { InputField } from '@/components/ui/Field';

export default function ResetPasswordForm() {
  const t = useTranslations('auth.reset');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('email'));
      return;
    }
    setBusy(true);
    setError(undefined);
    await fetch('/api/konto/passwort-vergessen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, locale }) });
    setBusy(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="liq-card p-8" role="status">
        <MailCheck size={40} className="text-accent" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="mt-4 text-xl font-bold text-navy">{t('sentTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t('sentText')}</p>
        <Link href="/login" className="liq-link mt-4 inline-block text-sm font-semibold text-navy">{t('backToLogin')}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="liq-card p-6 sm:p-8">
      <InputField label={t('email')} error={error} inputProps={{ id: 'reset-email', type: 'email', value: email, autoComplete: 'email', onChange: (e) => setEmail(e.target.value) }} />
      <div className="mt-6">
        <Button type="submit" size="lg" fullWidth disabled={busy}>{busy ? t('submitting') : t('submit')}</Button>
      </div>
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="liq-link text-muted">{t('backToLogin')}</Link>
      </p>
    </form>
  );
}
