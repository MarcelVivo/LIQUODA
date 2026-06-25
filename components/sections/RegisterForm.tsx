'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'issuer' | 'investor' | '';
  gdpr: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
  gdpr?: string;
}

const initialState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: '',
  gdpr: false,
};

export default function RegisterForm() {
  const t = useTranslations('register');
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = t('errorRequired');
    if (!form.lastName.trim()) e.lastName = t('errorRequired');
    if (!form.email.trim()) {
      e.email = t('errorRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = t('errorEmail');
    }
    if (!form.password) {
      e.password = t('errorRequired');
    } else if (form.password.length < 8) {
      e.password = t('errorPasswordLength');
    }
    if (!form.role) e.role = t('errorRole');
    if (!form.gdpr) e.gdpr = t('errorGdpr');
    return e;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitted(true);
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  if (submitted) {
    return (
      <section id="register" className="bg-surface py-24" aria-label="Register">
        <div className="mx-auto max-w-md px-4 sm:px-6 text-center">
          <CheckCircle
            size={56}
            className="mx-auto text-emerald-500"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <h2 className="mt-6 text-3xl font-bold text-navy">{t('successTitle')}</h2>
          <p className="mt-3 text-lg text-gray-500">{t('successMessage')}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="register" className="bg-surface py-24" aria-label="Register">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">{t('title')}</h2>
          <p className="mt-3 text-gray-500">{t('subtitle')}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-10 rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100"
        >
          {/* Name row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('firstName')}
              error={errors.firstName}
              inputProps={{
                id: 'firstName',
                type: 'text',
                placeholder: t('firstNamePlaceholder'),
                value: form.firstName,
                autoComplete: 'given-name',
                onChange: (e) => updateField('firstName', e.target.value),
              }}
            />
            <Field
              label={t('lastName')}
              error={errors.lastName}
              inputProps={{
                id: 'lastName',
                type: 'text',
                placeholder: t('lastNamePlaceholder'),
                value: form.lastName,
                autoComplete: 'family-name',
                onChange: (e) => updateField('lastName', e.target.value),
              }}
            />
          </div>

          {/* Email */}
          <div className="mt-4">
            <Field
              label={t('email')}
              error={errors.email}
              inputProps={{
                id: 'email',
                type: 'email',
                placeholder: t('emailPlaceholder'),
                value: form.email,
                autoComplete: 'email',
                onChange: (e) => updateField('email', e.target.value),
              }}
            />
          </div>

          {/* Password */}
          <div className="mt-4">
            <Field
              label={t('password')}
              error={errors.password}
              inputProps={{
                id: 'password',
                type: 'password',
                placeholder: t('passwordPlaceholder'),
                value: form.password,
                autoComplete: 'new-password',
                onChange: (e) => updateField('password', e.target.value),
              }}
            />
          </div>

          {/* Role toggle */}
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-gray-700">{t('roleLabel')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <RoleCard
                id="role-issuer"
                value="issuer"
                selected={form.role === 'issuer'}
                title={t('roleIssuer')}
                desc={t('roleIssuerDesc')}
                onSelect={() => {
                  updateField('role', 'issuer');
                }}
              />
              <RoleCard
                id="role-investor"
                value="investor"
                selected={form.role === 'investor'}
                title={t('roleInvestor')}
                desc={t('roleInvestorDesc')}
                onSelect={() => {
                  updateField('role', 'investor');
                }}
              />
            </div>
            {errors.role && (
              <p className="mt-1.5 text-xs text-red-600" role="alert">
                {errors.role}
              </p>
            )}
          </div>

          {/* GDPR */}
          <div className="mt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="gdpr"
                checked={form.gdpr}
                onChange={(e) => updateField('gdpr', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-navy focus:ring-navy"
              />
              <span className="text-sm text-gray-600">{t('gdpr')}</span>
            </label>
            {errors.gdpr && (
              <p className="mt-1.5 text-xs text-red-600" role="alert">
                {errors.gdpr}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="mt-8">
            <Button type="submit" size="lg" fullWidth>
              {t('submit')}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

interface FieldProps {
  label: string;
  error?: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & { id: string };
}

function Field({ label, error, inputProps }: FieldProps) {
  return (
    <div>
      <label htmlFor={inputProps.id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        {...inputProps}
        className={[
          'mt-1.5 block w-full rounded-md border px-3 py-2.5 text-sm text-gray-900',
          'placeholder:text-gray-400 outline-none',
          'transition-colors duration-150',
          'focus:border-navy focus:ring-2 focus:ring-navy/20',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputProps.id}-error` : undefined}
      />
      {error && (
        <p id={`${inputProps.id}-error`} className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface RoleCardProps {
  id: string;
  value: string;
  selected: boolean;
  title: string;
  desc: string;
  onSelect: () => void;
}

function RoleCard({ id, value, selected, title, desc, onSelect }: RoleCardProps) {
  return (
    <label
      htmlFor={id}
      className={[
        'flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-colors duration-150',
        selected
          ? 'border-navy bg-navy/5'
          : 'border-gray-200 hover:border-navy/40',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <input
          type="radio"
          id={id}
          name="role"
          value={value}
          checked={selected}
          onChange={onSelect}
          className="h-4 w-4 accent-navy"
        />
        <span className="text-sm font-semibold text-navy">{title}</span>
      </div>
      <p className="mt-1 pl-6 text-xs text-gray-500">{desc}</p>
    </label>
  );
}
