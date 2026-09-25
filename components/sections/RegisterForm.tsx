'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Button from '@/components/ui/Button';
import { InputField, CheckboxField } from '@/components/ui/Field';
import Section, { SectionHeading } from '@/components/ui/Section';

/**
 * Wartelisten-Formular. Nutzt den bestehenden Route Handler /api/register
 * und die bestehende Supabase-Tabelle «registrations».
 * Kontoerstellung mit Passwort folgt in Etappe 3.
 */

// Werte entsprechen den bestehenden Einträgen in der Tabelle «registrations»
type Role = 'Emittent' | 'Investor' | '';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  consent: boolean;
}

type FormErrors = Partial<Record<keyof FormState | 'server', string>>;

const initialState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  consent: false,
};

export default function RegisterForm() {
  const t = useTranslations('waitlist');
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = t('errorRequired');
    if (!form.lastName.trim()) e.lastName = t('errorRequired');
    if (!form.email.trim()) e.email = t('errorRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('errorEmail');
    if (!form.role) e.role = t('errorRole');
    if (!form.consent) e.consent = t('errorConsent');
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
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: form.role,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
        }),
      });
      if (!res.ok) throw new Error('request failed');
      setSubmitted(true);
    } catch {
      setErrors({ server: t('errorServer') });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <Section id="warteliste" tone="white" ariaLabel={t('title')}>
      <SectionHeading title={t('title')} lead={t('lead')} />

      <div className="mt-10 max-w-lg">
        {submitted ? (
          <div className="rounded-xl bg-cream p-8 ring-1 ring-navy/10" role="status">
            <CheckCircle size={40} className="text-accent-start" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-4 text-xl font-semibold text-navy">{t('successTitle')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy/80">{t('successMessage')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="rounded-xl bg-cream p-6 ring-1 ring-navy/10 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label={t('firstName')}
                error={errors.firstName}
                inputProps={{
                  id: 'wl-firstName',
                  type: 'text',
                  value: form.firstName,
                  autoComplete: 'given-name',
                  onChange: (e) => updateField('firstName', e.target.value),
                }}
              />
              <InputField
                label={t('lastName')}
                error={errors.lastName}
                inputProps={{
                  id: 'wl-lastName',
                  type: 'text',
                  value: form.lastName,
                  autoComplete: 'family-name',
                  onChange: (e) => updateField('lastName', e.target.value),
                }}
              />
            </div>

            <div className="mt-4">
              <InputField
                label={t('email')}
                error={errors.email}
                inputProps={{
                  id: 'wl-email',
                  type: 'email',
                  value: form.email,
                  autoComplete: 'email',
                  onChange: (e) => updateField('email', e.target.value),
                }}
              />
            </div>

            <fieldset className="mt-6">
              <legend className="mb-3 text-sm font-medium text-navy">{t('roleLabel')}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <RoleCard
                  id="wl-role-issuer"
                  selected={form.role === 'Emittent'}
                  title={t('roleIssuer')}
                  desc={t('roleIssuerDesc')}
                  onSelect={() => updateField('role', 'Emittent')}
                />
                <RoleCard
                  id="wl-role-investor"
                  selected={form.role === 'Investor'}
                  title={t('roleInvestor')}
                  desc={t('roleInvestorDesc')}
                  onSelect={() => updateField('role', 'Investor')}
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
                id="wl-consent"
                label={t('consent')}
                error={errors.consent}
                checked={form.consent}
                onChange={(v) => updateField('consent', v)}
              />
              <p className="mt-2 pl-7 text-xs text-navy/60">
                <Link href="/datenschutz" className="liq-link">
                  Datenschutz / Privacy
                </Link>
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
          </form>
        )}
      </div>
    </Section>
  );
}

function RoleCard({
  id,
  selected,
  title,
  desc,
  onSelect,
}: {
  id: string;
  selected: boolean;
  title: string;
  desc: string;
  onSelect: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={[
        'flex cursor-pointer flex-col rounded-lg border-2 bg-white p-4 transition-colors duration-150',
        selected ? 'border-navy' : 'border-navy/15 hover:border-navy/40',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <input
          type="radio"
          id={id}
          name="wl-role"
          checked={selected}
          onChange={onSelect}
          className="h-4 w-4 accent-navy"
        />
        <span className="text-sm font-semibold text-navy">{title}</span>
      </div>
      <p className="mt-1 pl-6 text-xs text-navy/60">{desc}</p>
    </label>
  );
}
