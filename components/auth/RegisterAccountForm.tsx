'use client';

import { useState, FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MailCheck } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Button from '@/components/ui/Button';
import { InputField, CheckboxField } from '@/components/ui/Field';
import RoleCard from '@/components/ui/RoleCard';

type Role = 'investor' | 'emittent' | '';

interface FormState {
  name: string;
  email: string;
  password: string;
  role: Role;
  consent: boolean;
}

type FormErrors = Partial<Record<keyof FormState | 'server', string>>;

const initialState: FormState = { name: '', email: '', password: '', role: '', consent: false };

export default function RegisterAccountForm() {
  const t = useTranslations('auth.register');
  const locale = useLocale();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = t('errors.required');
    if (!form.email.trim()) e.email = t('errors.required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('errors.email');
    if (form.password.length < 8) e.password = t('errors.password');
    if (!form.role) e.role = t('errors.role');
    if (!form.consent) e.consent = t('errors.consent');
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const prefix = locale === 'en' ? '/en' : '';
      const next = form.role === 'emittent' ? `${prefix}/emittent` : `${prefix}/portfolio`;
      const res = await fetch('/api/konto/registrieren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = ['weak_password', 'signup_failed', 'not_configured'].includes(data.error) ? data.error : 'server';
        setErrors({ server: t(`errors.${code}`) });
        return;
      }
      setDone(true);
    } catch {
      setErrors({ server: t('errors.server') });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  if (done) {
    return (
      <div className="liq-card p-8" role="status">
        <MailCheck size={40} className="text-accent" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="mt-4 text-xl font-bold text-navy">{t('successTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t('successMessage')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="liq-card p-6 sm:p-8">
      <InputField
        label={t('name')}
        error={errors.name}
        inputProps={{
          id: 'reg-name',
          type: 'text',
          value: form.name,
          autoComplete: 'name',
          onChange: (e) => updateField('name', e.target.value),
        }}
      />
      <div className="mt-4">
        <InputField
          label={t('email')}
          error={errors.email}
          inputProps={{
            id: 'reg-email',
            type: 'email',
            value: form.email,
            autoComplete: 'email',
            onChange: (e) => updateField('email', e.target.value),
          }}
        />
      </div>
      <div className="mt-4">
        <InputField
          label={t('password')}
          hint={t('passwordHint')}
          error={errors.password}
          inputProps={{
            id: 'reg-password',
            type: 'password',
            value: form.password,
            autoComplete: 'new-password',
            minLength: 8,
            onChange: (e) => updateField('password', e.target.value),
          }}
        />
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-medium text-navy">{t('roleLabel')}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <RoleCard
            id="reg-role-investor"
            name="reg-role"
            selected={form.role === 'investor'}
            title={t('roleInvestor')}
            desc={t('roleInvestorDesc')}
            onSelect={() => updateField('role', 'investor')}
          />
          <RoleCard
            id="reg-role-emittent"
            name="reg-role"
            selected={form.role === 'emittent'}
            title={t('roleIssuer')}
            desc={t('roleIssuerDesc')}
            onSelect={() => updateField('role', 'emittent')}
          />
        </div>
        {errors.role && (
          <p className="mt-1.5 text-xs text-red-700" role="alert">
            {errors.role}
          </p>
        )}
      </fieldset>

      <div className="mt-6">
        <CheckboxField
          id="reg-consent"
          label={t('consent')}
          error={errors.consent}
          checked={form.consent}
          onChange={(v) => updateField('consent', v)}
        />
        <p className="mt-2 flex flex-wrap gap-x-3 pl-7 text-xs text-navy/70">
          <Link href="/agb" className="liq-link">AGB</Link>
          <Link href="/datenschutz" className="liq-link">Datenschutz / Privacy</Link>
          <Link href="/risiken" className="liq-link">Risiken / Risks</Link>
        </p>
      </div>

      {errors.server && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {errors.server}
        </p>
      )}

      <div className="mt-8">
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        {t('haveAccount')}{' '}
        <Link href="/login" className="liq-link font-semibold text-navy">
          {t('loginLink')}
        </Link>
      </p>
    </form>
  );
}
