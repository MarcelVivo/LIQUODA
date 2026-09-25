'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Button from '@/components/ui/Button';
import { InputField, SelectField, TextareaField, CheckboxField } from '@/components/ui/Field';
import Section, { SectionHeading } from '@/components/ui/Section';

export const ASSET_TYPES = ['company', 'real_estate', 'energy', 'collectible', 'other'] as const;
type AssetType = (typeof ASSET_TYPES)[number];

interface FormState {
  name: string;
  company: string;
  email: string;
  assetType: AssetType | '';
  amount: string;
  description: string;
  consent: boolean;
}

type FormErrors = Partial<Record<keyof FormState | 'server', string>>;

const initialState: FormState = {
  name: '',
  company: '',
  email: '',
  assetType: '',
  amount: '',
  description: '',
  consent: false,
};

export default function ProjectRequestForm() {
  const t = useTranslations('projectRequest');
  const tIssuers = useTranslations('issuers');
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = t('errorRequired');
    if (!form.email.trim()) e.email = t('errorRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('errorEmail');
    if (!form.assetType) e.assetType = t('errorAssetType');
    if (form.amount.trim() && !/^[1-9]\d*$/.test(form.amount.trim())) e.amount = t('errorAmount');
    const descLen = form.description.trim().length;
    if (descLen < 20 || descLen > 2000) e.description = t('errorDescription');
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
      const res = await fetch('/api/projektanfrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          assetType: form.assetType,
          amount: form.amount.trim() ? Number(form.amount.trim()) : null,
          description: form.description,
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
    <Section id="projektanfrage" ariaLabel={tIssuers('requestTitle')}>
      <SectionHeading title={tIssuers('requestTitle')} lead={tIssuers('requestLead')} />

      <div className="mt-10 max-w-2xl">
        {submitted ? (
          <div className="liq-card p-8" role="status">
            <CheckCircle size={40} className="text-accent-start" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-4 text-xl font-semibold text-navy">{t('successTitle')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t('successMessage')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="liq-card p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label={t('name')}
                error={errors.name}
                inputProps={{
                  id: 'pr-name',
                  type: 'text',
                  value: form.name,
                  autoComplete: 'name',
                  onChange: (e) => updateField('name', e.target.value),
                }}
              />
              <InputField
                label={t('company')}
                hint={t('companyHint')}
                error={errors.company}
                inputProps={{
                  id: 'pr-company',
                  type: 'text',
                  value: form.company,
                  autoComplete: 'organization',
                  onChange: (e) => updateField('company', e.target.value),
                }}
              />
            </div>

            <div className="mt-4">
              <InputField
                label={t('email')}
                error={errors.email}
                inputProps={{
                  id: 'pr-email',
                  type: 'email',
                  value: form.email,
                  autoComplete: 'email',
                  onChange: (e) => updateField('email', e.target.value),
                }}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SelectField
                label={t('assetType')}
                error={errors.assetType}
                selectProps={{
                  id: 'pr-assetType',
                  value: form.assetType,
                  onChange: (e) => updateField('assetType', e.target.value as AssetType | ''),
                }}
              >
                <option value="">{t('assetTypePlaceholder')}</option>
                {ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`assetTypes.${type}`)}
                  </option>
                ))}
              </SelectField>
              <InputField
                label={t('amount')}
                hint={t('amountHint')}
                error={errors.amount}
                inputProps={{
                  id: 'pr-amount',
                  type: 'text',
                  inputMode: 'numeric',
                  value: form.amount,
                  onChange: (e) => updateField('amount', e.target.value),
                }}
              />
            </div>

            <div className="mt-4">
              <TextareaField
                label={t('description')}
                hint={t('descriptionHint')}
                error={errors.description}
                textareaProps={{
                  id: 'pr-description',
                  value: form.description,
                  maxLength: 2000,
                  onChange: (e) => updateField('description', e.target.value),
                }}
              />
            </div>

            <div className="mt-6">
              <CheckboxField
                id="pr-consent"
                label={t('consent')}
                error={errors.consent}
                checked={form.consent}
                onChange={(v) => updateField('consent', v)}
              />
              <p className="mt-2 pl-7 text-xs text-muted">
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
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? t('submitting') : t('submit')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Section>
  );
}
