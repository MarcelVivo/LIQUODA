'use client';

import { useState, FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Button from '@/components/ui/Button';
import { InputField } from '@/components/ui/Field';

type Mode = 'password' | 'magic';

export default function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const t = useTranslations('auth.login');
  const locale = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const prefix = locale === 'en' ? '/en' : '';
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = t('errors.required');
    else if (!validEmail) errs.email = t('errors.email');
    if (mode === 'password' && !password) errs.password = t('errors.required');
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      if (mode === 'magic') {
        const res = await fetch('/api/konto/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, next: next ?? `${prefix}/portfolio` }),
        });
        if (res.status === 503) {
          setErrors({ server: t('errors.not_configured') });
          return;
        }
        setMagicSent(true);
        return;
      }
      const res = await fetch('/api/konto/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = ['invalid_credentials', 'email_not_confirmed', 'not_configured'].includes(data.error) ? data.error : 'server';
        setErrors({ server: t(`errors.${code}`) });
        return;
      }
      const home = data.role === 'emittent' ? `${prefix}/emittent` : data.role === 'admin' ? '/admin' : `${prefix}/portfolio`;
      router.push(next && next !== '/' ? next : home);
      router.refresh();
    } catch {
      setErrors({ server: t('errors.server') });
    } finally {
      setSubmitting(false);
    }
  };

  if (magicSent) {
    return (
      <div className="liq-card p-8" role="status">
        <MailCheck size={40} className="text-accent" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="mt-4 text-xl font-bold text-navy">{t('magicSentTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t('magicSentText')}</p>
      </div>
    );
  }

  const tabClass = (active: boolean) =>
    [
      'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
      active ? 'bg-navy text-white' : 'text-muted hover:text-navy',
    ].join(' ');

  return (
    <form onSubmit={handleSubmit} noValidate className="liq-card p-6 sm:p-8">
      {notice && (
        <p className="mb-5 rounded-md bg-cream-dark px-3 py-2 text-sm text-body" role="status">
          {notice}
        </p>
      )}

      <div className="flex rounded-full border border-navy/10 bg-cream p-1" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'password'} className={tabClass(mode === 'password')} onClick={() => setMode('password')}>
          {t('tabPassword')}
        </button>
        <button type="button" role="tab" aria-selected={mode === 'magic'} className={tabClass(mode === 'magic')} onClick={() => setMode('magic')}>
          {t('tabMagic')}
        </button>
      </div>

      {mode === 'magic' && <p className="mt-5 text-sm leading-relaxed text-muted">{t('magicLead')}</p>}

      <div className="mt-5">
        <InputField
          label={t('email')}
          error={errors.email}
          inputProps={{
            id: 'login-email',
            type: 'email',
            value: email,
            autoComplete: 'email',
            onChange: (e) => setEmail(e.target.value),
          }}
        />
      </div>

      {mode === 'password' && (
        <div className="mt-4">
          <InputField
            label={t('password')}
            error={errors.password}
            inputProps={{
              id: 'login-password',
              type: 'password',
              value: password,
              autoComplete: 'current-password',
              onChange: (e) => setPassword(e.target.value),
            }}
          />
        </div>
      )}

      {errors.server && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {errors.server}
        </p>
      )}

      <div className="mt-8">
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {mode === 'magic' ? (submitting ? t('magicSending') : t('magicSubmit')) : submitting ? t('submitting') : t('submit')}
        </Button>
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        {t('noAccount')}{' '}
        <Link href="/registrieren" className="liq-link font-semibold text-navy">
          {t('registerLink')}
        </Link>
      </p>
    </form>
  );
}
