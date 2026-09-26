'use client';

import { useState, FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { CheckCircle, FileText, Trash2, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { InputField, SelectField, TextareaField, CheckboxField } from '@/components/ui/Field';
import { formatDate } from '@/lib/format';
import { ASSET_TYPES } from '@/lib/projects/types';
import type { OwnProject } from '@/lib/emittent';
import type { DocumentRecord } from '@/lib/documents';

type Step = 'basics' | 'texts' | 'amounts' | 'documents' | 'submit';
const STEPS: Step[] = ['basics', 'texts', 'amounts', 'documents', 'submit'];
const DOC_TYPES = ['contract', 'prospectus', 'valuation', 'financials', 'other'] as const;

interface Draft {
  titleDe: string; titleEn: string;
  locationDe: string; locationEn: string;
  assetType: string; tokenModel: string;
  summaryDe: string; summaryEn: string;
  descriptionDe: string; descriptionEn: string;
  purposeDe: string; purposeEn: string;
  risksDe: string; risksEn: string;
  target: string; min: string; deadline: string;
}

function toDraft(p: OwnProject): Draft {
  return {
    titleDe: p.title.de ?? '', titleEn: p.title.en ?? '',
    locationDe: p.location.de ?? '', locationEn: p.location.en ?? '',
    assetType: p.asset_type, tokenModel: p.token_model,
    summaryDe: p.summary.de ?? '', summaryEn: p.summary.en ?? '',
    descriptionDe: (p.description?.de ?? []).join('\n\n'), descriptionEn: (p.description?.en ?? []).join('\n\n'),
    purposeDe: p.purpose.de ?? '', purposeEn: p.purpose.en ?? '',
    risksDe: (p.risks?.de ?? []).join('\n'), risksEn: (p.risks?.en ?? []).join('\n'),
    target: String(Math.round(Number(p.target_amount_chf))), min: String(Math.round(Number(p.min_investment_chf))), deadline: p.deadline,
  };
}

/** Projekt-Wizard (Spec, Abschnitt 4, Emittent Schritt 4): Informationen, Dokumente, Zielbetrag, Laufzeit. */
export default function ProjectWizard({
  project,
  documents: initialDocuments,
  problems: initialProblems,
}: {
  project: OwnProject;
  documents: DocumentRecord[];
  problems: string[];
}) {
  const t = useTranslations('emittent.wizard');
  const tProjects = useTranslations('projects');
  const locale = useLocale();
  const router = useRouter();
  const editable = project.status === 'draft';
  const [step, setStep] = useState<Step>('basics');
  const [draft, setDraft] = useState<Draft>(toDraft(project));
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [problems, setProblems] = useState<string[]>(initialProblems);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: keyof Draft, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSavedAt(null);
  };

  const payloadFor = (s: Step): Record<string, unknown> => {
    switch (s) {
      case 'basics':
        return {
          title: { de: draft.titleDe, en: draft.titleEn },
          location: { de: draft.locationDe, en: draft.locationEn },
          assetType: draft.assetType,
          tokenModel: draft.tokenModel,
        };
      case 'texts':
        return {
          summary: { de: draft.summaryDe, en: draft.summaryEn },
          description: { de: draft.descriptionDe, en: draft.descriptionEn },
          purpose: { de: draft.purposeDe, en: draft.purposeEn },
          risks: { de: draft.risksDe, en: draft.risksEn },
        };
      case 'amounts':
        return { targetAmountChf: Number(draft.target), minInvestmentChf: Number(draft.min), deadline: draft.deadline };
      default:
        return {};
    }
  };

  const validateStep = (s: Step): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 'basics') {
      if (!draft.titleDe.trim()) e.titleDe = t('errors.required');
      if (!draft.locationDe.trim()) e.locationDe = t('errors.required');
    }
    if (s === 'texts') {
      if (!draft.summaryDe.trim()) e.summaryDe = t('errors.required');
      if (!draft.descriptionDe.trim()) e.descriptionDe = t('errors.required');
      if (!draft.purposeDe.trim()) e.purposeDe = t('errors.required');
    }
    if (s === 'amounts') {
      if (!/^\d+$/.test(draft.target) || Number(draft.target) < 10000) e.target = t('errors.number');
      if (!/^\d+$/.test(draft.min) || Number(draft.min) < 100 || Number(draft.min) > 20000) e.min = t('errors.number');
      if (!draft.deadline || new Date(draft.deadline) <= new Date()) e.deadline = t('errors.date');
    }
    return e;
  };

  const save = async (s: Step): Promise<boolean> => {
    if (!editable) return true;
    const errs = validateStep(s);
    setFieldErrors(errs);
    if (Object.keys(errs).length) return false;
    const payload = payloadFor(s);
    if (Object.keys(payload).length === 0) return true;
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/emittent/projekte/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(t(data.error === 'locked' ? 'errors.locked' : 'errors.server'));
        return false;
      }
      setSavedAt(Date.now());
      router.refresh();
      return true;
    } catch {
      setError(t('errors.server'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goto = async (target: Step) => {
    const ok = await save(step);
    if (ok) setStep(target);
  };

  const idx = STEPS.indexOf(step);

  return (
    <div>
      {!editable && (
        <p className="liq-card mb-6 border-l-4 border-accent p-4 text-sm text-body" role="status">
          {t('locked')}
        </p>
      )}

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => goto(s)}
              className={[
                'liq-chip gap-2 transition-colors',
                s === step ? 'border-accent bg-accent text-white' : i < idx ? 'border-accent/40 text-navy' : 'border-navy/10 text-muted hover:border-accent',
              ].join(' ')}
              aria-current={s === step ? 'step' : undefined}
            >
              <span className="font-bold">{i + 1}</span> {t(`steps.${s}`)}
            </button>
          </li>
        ))}
      </ol>

      <div className="liq-card mt-6 p-6 sm:p-8">
        {step === 'basics' && (
          <div className="space-y-4">
            <p className="text-xs text-muted">{t('deHint')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label={t('basics.titleDe')} error={fieldErrors.titleDe} inputProps={{ id: 'w-titleDe', value: draft.titleDe, disabled: !editable, onChange: (e) => set('titleDe', e.target.value) }} />
              <InputField label={t('basics.titleEn')} inputProps={{ id: 'w-titleEn', value: draft.titleEn, disabled: !editable, onChange: (e) => set('titleEn', e.target.value) }} />
              <InputField label={t('basics.locationDe')} hint={t('basics.locationHint')} error={fieldErrors.locationDe} inputProps={{ id: 'w-locDe', value: draft.locationDe, disabled: !editable, onChange: (e) => set('locationDe', e.target.value) }} />
              <InputField label={t('basics.locationEn')} inputProps={{ id: 'w-locEn', value: draft.locationEn, disabled: !editable, onChange: (e) => set('locationEn', e.target.value) }} />
              <SelectField label={t('basics.assetType')} selectProps={{ id: 'w-asset', value: draft.assetType, disabled: !editable, onChange: (e) => set('assetType', e.target.value) }}>
                {ASSET_TYPES.map((a) => (
                  <option key={a} value={a}>{tProjects(`assetTypes.${a}`)}</option>
                ))}
              </SelectField>
              <SelectField label={t('basics.tokenModel')} hint={t('basics.tokenModelHint')} selectProps={{ id: 'w-token', value: draft.tokenModel, disabled: !editable, onChange: (e) => set('tokenModel', e.target.value) }}>
                {(['erc20', 'erc721', 'erc1155'] as const).map((m) => (
                  <option key={m} value={m}>{tProjects(`detail.tokenModels.${m}`)}</option>
                ))}
              </SelectField>
            </div>
          </div>
        )}

        {step === 'texts' && (
          <div className="space-y-4">
            <p className="text-xs text-muted">{t('deHint')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextareaField label={t('texts.summaryDe')} hint={t('texts.summaryHint')} error={fieldErrors.summaryDe} textareaProps={{ id: 'w-sumDe', value: draft.summaryDe, maxLength: 300, disabled: !editable, onChange: (e) => set('summaryDe', e.target.value) }} />
              <TextareaField label={t('texts.summaryEn')} textareaProps={{ id: 'w-sumEn', value: draft.summaryEn, maxLength: 300, disabled: !editable, onChange: (e) => set('summaryEn', e.target.value) }} />
              <TextareaField label={t('texts.descriptionDe')} hint={t('texts.descriptionHint')} error={fieldErrors.descriptionDe} textareaProps={{ id: 'w-descDe', value: draft.descriptionDe, disabled: !editable, onChange: (e) => set('descriptionDe', e.target.value) }} />
              <TextareaField label={t('texts.descriptionEn')} textareaProps={{ id: 'w-descEn', value: draft.descriptionEn, disabled: !editable, onChange: (e) => set('descriptionEn', e.target.value) }} />
              <TextareaField label={t('texts.purposeDe')} error={fieldErrors.purposeDe} textareaProps={{ id: 'w-purDe', value: draft.purposeDe, maxLength: 300, disabled: !editable, onChange: (e) => set('purposeDe', e.target.value) }} />
              <TextareaField label={t('texts.purposeEn')} textareaProps={{ id: 'w-purEn', value: draft.purposeEn, maxLength: 300, disabled: !editable, onChange: (e) => set('purposeEn', e.target.value) }} />
              <TextareaField label={t('texts.risksDe')} hint={t('texts.risksHint')} textareaProps={{ id: 'w-riskDe', value: draft.risksDe, disabled: !editable, onChange: (e) => set('risksDe', e.target.value) }} />
              <TextareaField label={t('texts.risksEn')} textareaProps={{ id: 'w-riskEn', value: draft.risksEn, disabled: !editable, onChange: (e) => set('risksEn', e.target.value) }} />
            </div>
          </div>
        )}

        {step === 'amounts' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <InputField label={t('amounts.target')} hint={t('amounts.targetHint')} error={fieldErrors.target} inputProps={{ id: 'w-target', inputMode: 'numeric', value: draft.target, disabled: !editable, onChange: (e) => set('target', e.target.value) }} />
            <InputField label={t('amounts.min')} hint={t('amounts.minHint')} error={fieldErrors.min} inputProps={{ id: 'w-min', inputMode: 'numeric', value: draft.min, disabled: !editable, onChange: (e) => set('min', e.target.value) }} />
            <InputField label={t('amounts.deadline')} hint={t('amounts.deadlineHint')} error={fieldErrors.deadline} inputProps={{ id: 'w-deadline', type: 'date', value: draft.deadline, disabled: !editable, onChange: (e) => set('deadline', e.target.value) }} />
          </div>
        )}

        {step === 'documents' && (
          <DocumentsStep
            projectId={project.id}
            editable={editable}
            documents={documents}
            onChange={(docs) => {
              setDocuments(docs);
              setProblems((p) => (docs.length ? p.filter((x) => x !== 'documents') : Array.from(new Set([...p, 'documents']))));
            }}
            locale={locale}
          />
        )}

        {step === 'submit' && (
          <SubmitStep projectId={project.id} editable={editable} problems={problems} />
        )}

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}

        {step !== 'submit' && (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {idx > 0 && (
              <Button type="button" variant="outline" onClick={() => goto(STEPS[idx - 1])} disabled={saving}>
                {t('prev')}
              </Button>
            )}
            {editable && step !== 'documents' && (
              <Button type="button" variant="outline" onClick={() => save(step)} disabled={saving}>
                {saving ? t('saving') : t('save')}
              </Button>
            )}
            <Button type="button" onClick={() => goto(STEPS[idx + 1])} disabled={saving}>
              {t('next')}
            </Button>
            {savedAt && <span className="text-xs text-accent">{t('saved')}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentsStep({
  projectId,
  editable,
  documents,
  onChange,
  locale,
}: {
  projectId: string;
  editable: boolean;
  documents: DocumentRecord[];
  onChange: (docs: DocumentRecord[]) => void;
  locale: string;
}) {
  const t = useTranslations('emittent.wizard.documents');
  const tProjects = useTranslations('projects.detail');
  const [type, setType] = useState<string>('prospectus');
  const [titleDe, setTitleDe] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [deleting, setDeleting] = useState<string | null>(null);

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    if (!titleDe.trim() || !file) {
      setError(t('errors.required'));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const form = new FormData();
      form.set('projectId', projectId);
      form.set('type', type);
      form.set('titleDe', titleDe);
      form.set('titleEn', titleEn);
      form.set('file', file);
      const res = await fetch('/api/emittent/dokumente', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = ['file_type', 'file_size', 'upload'].includes(data.error) ? data.error : 'server';
        setError(t(`errors.${code}`));
        return;
      }
      onChange([...documents, data.document as DocumentRecord]);
      setTitleDe('');
      setTitleEn('');
      setFile(null);
      (document.getElementById('w-file') as HTMLInputElement | null)?.value && ((document.getElementById('w-file') as HTMLInputElement).value = '');
    } catch {
      setError(t('errors.server'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/emittent/dokumente/${id}`, { method: 'DELETE' });
      if (res.ok) onChange(documents.filter((d) => d.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <p className="text-sm leading-relaxed text-muted">{t('lead')}</p>

      {documents.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t('empty')}</p>
      ) : (
        <ul className="mt-4 divide-y divide-navy/10 rounded-xl border border-navy/10">
          {documents.map((d) => (
            <li key={d.id} className="flex items-start gap-3 px-4 py-3">
              <FileText size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <a href={`/api/dokumente/${d.id}`} target="_blank" rel="noopener" className="liq-link text-sm font-semibold text-navy">
                  {d.title[locale as 'de' | 'en'] || d.title.de}
                </a>
                <p className="text-xs text-muted">
                  {tProjects(`docTypes.${d.type}`)} · {tProjects('version', { version: d.version })} · {formatDate(d.created_at.slice(0, 10), locale)}
                </p>
                {d.sha256_hash && (
                  <p className="mt-0.5 truncate font-mono text-[10px] text-muted" title={d.sha256_hash}>
                    {t('hash')}: {d.sha256_hash}
                  </p>
                )}
              </div>
              {editable && (
                <button type="button" onClick={() => remove(d.id)} disabled={deleting === d.id} className="rounded p-1 text-muted hover:text-red-700" aria-label={t('delete')}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <form onSubmit={upload} className="mt-6 grid gap-4 rounded-xl border border-navy/10 bg-cream p-4 sm:grid-cols-2">
          <SelectField label={t('type')} selectProps={{ id: 'w-doctype', value: type, onChange: (e) => setType(e.target.value) }}>
            {DOC_TYPES.map((dt) => (
              <option key={dt} value={dt}>{tProjects(`docTypes.${dt}`)}</option>
            ))}
          </SelectField>
          <InputField label={t('file')} inputProps={{ id: 'w-file', type: 'file', accept: 'application/pdf,image/jpeg,image/png', onChange: (e) => setFile(e.target.files?.[0] ?? null) }} />
          <InputField label={t('titleDe')} inputProps={{ id: 'w-doctitleDe', value: titleDe, onChange: (e) => setTitleDe(e.target.value) }} />
          <InputField label={t('titleEn')} inputProps={{ id: 'w-doctitleEn', value: titleEn, onChange: (e) => setTitleEn(e.target.value) }} />
          {error && (
            <p className="text-sm text-red-800 sm:col-span-2" role="alert">{error}</p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? t('uploading') : t('upload')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function SubmitStep({ projectId, editable, problems }: { projectId: string; editable: boolean; problems: string[] }) {
  const t = useTranslations('emittent.wizard.submit');
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const keys = ['title', 'summary', 'description', 'purpose', 'location', 'target', 'min', 'deadline', 'documents'];

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/emittent/projekte/${projectId}/einreichen`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error === 'incomplete' ? (data.problems as string[]).map((p) => t(`problems.${p}`)).join(' · ') : 'Fehler / error');
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (done || !editable) {
    return (
      <div role="status">
        <CheckCircle size={40} className="text-accent" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="mt-4 text-xl font-bold text-navy">{t('doneTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t('doneText')}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-muted">{t('lead')}</p>
      <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('checklist')}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {keys.map((k) => {
          const bad = problems.includes(k);
          return (
            <li key={k} className={`flex items-center gap-2 ${bad ? 'text-red-800' : 'text-muted'}`}>
              {bad ? <XCircle size={16} aria-hidden="true" /> : <CheckCircle size={16} className="text-accent" aria-hidden="true" />}
              {bad ? t(`problems.${k}`) : t(`problems.${k}`).replace(/ (fehlt|ungültig.*|liegt.*|hochgeladen|missing|invalid.*|is not.*|uploaded)$/i, '')}
            </li>
          );
        })}
      </ul>
      {problems.length === 0 && <p className="mt-3 text-sm font-semibold text-accent">{t('ready')}</p>}
      <div className="mt-6">
        <CheckboxField id="w-consent" label={t('consent')} checked={consent} onChange={setConsent} />
      </div>
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>
      )}
      <div className="mt-6">
        <Button type="button" size="lg" onClick={submit} disabled={busy || !consent || problems.length > 0}>
          {busy ? t('submitting') : t('action')}
        </Button>
      </div>
    </div>
  );
}
