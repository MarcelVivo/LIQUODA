'use client';

import { useState, FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Button from '@/components/ui/Button';
import { InputField, CheckboxField } from '@/components/ui/Field';
import { formatChf, formatDate } from '@/lib/format';
import { investorFeeChf, MAX_INVESTMENT_CHF } from '@/lib/fees';

export interface InvestFlowProject {
  slug: string;
  title: string;
  issuerName: string;
  minInvestmentChf: number;
  openAmountChf: number;
  deadline: string;
  tokenModelLabel: string;
}

const CONSENT_KEYS = ['risks', 'loss', 'lock', 'role', 'refund'] as const;
type ConsentKey = (typeof CONSENT_KEYS)[number];
type Step = 1 | 2 | 3;

/**
 * Investitionsprozess (Spec, Abschnitt 7): Betrag -> Zusammenfassung ->
 * aktive Zustimmung -> Zahlung in CHF über Stripe Checkout.
 */
export default function InvestFlow({ project }: { project: InvestFlowProject }) {
  const t = useTranslations('invest');
  const locale = useLocale();
  const [step, setStep] = useState<Step>(1);
  const [amountInput, setAmountInput] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({
    risks: false,
    loss: false,
    lock: false,
    role: false,
    refund: false,
  });
  const [consentError, setConsentError] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const amount = Number(amountInput.trim());
  const fee = Number.isFinite(amount) ? investorFeeChf(amount) : 0;
  const maxAllowed = Math.min(MAX_INVESTMENT_CHF, project.openAmountChf);

  const validateAmount = (): string | undefined => {
    const raw = amountInput.trim();
    if (!raw) return t('amount.errors.required');
    if (!/^\d+$/.test(raw)) return t('amount.errors.integer');
    const n = Number(raw);
    if (n < project.minInvestmentChf) return t('amount.errors.min', { min: formatChf(project.minInvestmentChf) });
    if (n > MAX_INVESTMENT_CHF) return t('amount.errors.max', { max: formatChf(MAX_INVESTMENT_CHF) });
    if (n > project.openAmountChf) return t('amount.errors.open', { open: formatChf(project.openAmountChf) });
    return undefined;
  };

  const goSummary = (e: FormEvent) => {
    e.preventDefault();
    const err = validateAmount();
    setAmountError(err);
    if (!err) setStep(2);
  };

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    if (!CONSENT_KEYS.every((k) => consents[k])) {
      setConsentError(t('consent.error'));
      return;
    }
    setConsentError(undefined);
    setServerError(undefined);
    setSubmitting(true);
    try {
      const res = await fetch('/api/investieren/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: project.slug, amount, consents, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        const known = ['not_configured', 'project_not_open', 'kyc_not_approved', 'amount_invalid', 'consent_missing'];
        setServerError(t(`errors.${known.includes(data.error) ? data.error : 'server'}`));
        return;
      }
      window.location.assign(data.url as string);
    } catch {
      setServerError(t('errors.server'));
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [t('steps.amount'), t('steps.summary'), t('steps.consent'), t('steps.payment')];

  return (
    <div className="max-w-2xl">
      {/* Schrittanzeige: wo der Nutzer steht, was als Nächstes kommt */}
      <ol className="flex flex-wrap gap-2" aria-label={t('stepOf', { step, total: 4 })}>
        {steps.map((label, i) => {
          const n = i + 1;
          const state = n < step ? 'done' : n === step ? 'current' : 'todo';
          return (
            <li
              key={label}
              className={[
                'liq-chip gap-2',
                state === 'current' ? 'border-accent bg-accent text-white' : state === 'done' ? 'border-accent/40 text-navy' : 'border-navy/10 text-muted',
              ].join(' ')}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="font-bold">{n}</span> {label}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <form onSubmit={goSummary} noValidate className="liq-card mt-8 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">{t('amount.title')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('amount.lead', {
              min: formatChf(project.minInvestmentChf),
              max: formatChf(MAX_INVESTMENT_CHF),
              open: formatChf(project.openAmountChf),
            })}
          </p>
          <div className="mt-6">
            <InputField
              label={t('amount.label')}
              error={amountError}
              inputProps={{
                id: 'invest-amount',
                type: 'text',
                inputMode: 'numeric',
                value: amountInput,
                autoFocus: true,
                onChange: (e) => {
                  setAmountInput(e.target.value);
                  if (amountError) setAmountError(undefined);
                },
              }}
            />
            {maxAllowed < MAX_INVESTMENT_CHF && (
              <p className="mt-2 text-xs text-muted">{t('amount.errors.open', { open: formatChf(project.openAmountChf) })}</p>
            )}
          </div>
          <div className="mt-8">
            <Button type="submit" size="lg">
              {t('amount.next')}
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="liq-card mt-8 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">{t('summary.title')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t('summary.lead')}</p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t('project')}</dt>
              <dd className="text-right font-semibold text-navy">{project.title}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t('summary.issuer')}</dt>
              <dd className="text-right font-semibold text-navy">{project.issuerName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t('summary.deadline')}</dt>
              <dd className="font-semibold text-navy">{formatDate(project.deadline, locale)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t('summary.tokenModel')}</dt>
              <dd className="text-right font-semibold text-navy">{project.tokenModelLabel}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-navy/10 pt-3">
              <dt className="text-muted">{t('summary.amount')}</dt>
              <dd className="font-semibold text-navy">{formatChf(amount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t('summary.fee')}</dt>
              <dd className="font-semibold text-navy">{formatChf(fee)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-navy/10 pt-3 text-base">
              <dt className="font-semibold text-navy">{t('summary.total')}</dt>
              <dd className="font-extrabold text-navy">{formatChf(amount + fee)}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              {t('summary.back')}
            </Button>
            <Button type="button" size="lg" onClick={() => setStep(3)}>
              {t('summary.next')}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={pay} noValidate className="liq-card mt-8 border-l-4 border-accent p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">{t('consent.title')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t('consent.lead')}</p>
          <div className="mt-6 space-y-4">
            {CONSENT_KEYS.map((key) => (
              <CheckboxField
                key={key}
                id={`consent-${key}`}
                label={t(`consent.items.${key}`)}
                checked={consents[key]}
                onChange={(v) => {
                  setConsents((prev) => ({ ...prev, [key]: v }));
                  if (consentError) setConsentError(undefined);
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            <Link href={`/projekte/${project.slug}#risiken`} className="liq-link" target="_blank" rel="noopener">
              {t('consent.risksLink')}
            </Link>
          </p>
          {consentError && (
            <p className="mt-3 text-xs text-red-700" role="alert">
              {consentError}
            </p>
          )}
          <p className="mt-6 rounded-lg bg-cream px-3 py-2.5 text-xs leading-relaxed text-muted">{t('consent.paymentNote')}</p>
          {serverError && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {serverError}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={submitting}>
              {t('consent.back')}
            </Button>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? t('consent.paying') : t('consent.next')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
