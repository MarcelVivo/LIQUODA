'use client';

import { useState, FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { InputField, TextareaField } from '@/components/ui/Field';
import { formatDate } from '@/lib/format';
import type { ProjectQuestion, ProjectUpdate } from '@/lib/community';

/** Emittent: Neuigkeiten schreiben und Fragen beantworten. */
export default function CommunicationPanel({
  projectId,
  canPost,
  updates,
  questions,
}: {
  projectId: string;
  canPost: boolean;
  updates: ProjectUpdate[];
  questions: ProjectQuestion[];
}) {
  const t = useTranslations('community');
  const locale = useLocale() as 'de' | 'en';
  const router = useRouter();
  const [form, setForm] = useState({ titleDe: '', titleEn: '', bodyDe: '', bodyEn: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answering, setAnswering] = useState<string | null>(null);

  const publish = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.titleDe.trim() || !form.bodyDe.trim()) return setError(t('updates.errors.required'));
    setBusy(true);
    setError(undefined);
    const res = await fetch('/api/emittent/neuigkeiten', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, title: { de: form.titleDe, en: form.titleEn }, body: { de: form.bodyDe, en: form.bodyEn } }) });
    setBusy(false);
    if (!res.ok) return setError(t('updates.errors.server'));
    setForm({ titleDe: '', titleEn: '', bodyDe: '', bodyEn: '' });
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!window.confirm(t('updates.delete') + '?')) return;
    await fetch('/api/emittent/neuigkeiten', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  const answer = async (id: string) => {
    const text = (answers[id] ?? '').trim();
    if (text.length < 2) return;
    setAnswering(id);
    const res = await fetch('/api/emittent/antworten', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: id, answer: text }) });
    setAnswering(null);
    if (res.ok) router.refresh();
  };

  const open = questions.filter((q) => !q.answer);
  const answered = questions.filter((q) => q.answer);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="liq-card p-6">
          <h2 className="text-lg font-bold text-navy">{t('updates.write')}</h2>
          {canPost ? (
            <form onSubmit={publish} noValidate className="mt-4 space-y-4">
              <InputField label={t('updates.titleDe')} inputProps={{ id: 'u-titleDe', value: form.titleDe, maxLength: 120, onChange: (e) => setForm({ ...form, titleDe: e.target.value }) }} />
              <InputField label={t('updates.titleEn')} inputProps={{ id: 'u-titleEn', value: form.titleEn, maxLength: 120, onChange: (e) => setForm({ ...form, titleEn: e.target.value }) }} />
              <TextareaField label={t('updates.bodyDe')} hint={t('updates.bodyHint')} error={error} textareaProps={{ id: 'u-bodyDe', value: form.bodyDe, onChange: (e) => setForm({ ...form, bodyDe: e.target.value }) }} />
              <TextareaField label={t('updates.bodyEn')} textareaProps={{ id: 'u-bodyEn', value: form.bodyEn, onChange: (e) => setForm({ ...form, bodyEn: e.target.value }) }} />
              <Button type="submit" disabled={busy}>{busy ? t('updates.publishing') : t('updates.publish')}</Button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-muted">{t('updates.notAllowed')}</p>
          )}
        </div>
        <div className="liq-card p-6">
          <h2 className="text-lg font-bold text-navy">{t('updates.title')}</h2>
          {updates.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t('updates.empty')}</p>
          ) : (
            <ul className="mt-4 divide-y divide-navy/10">
              {updates.map((u) => (
                <li key={u.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">{u.title[locale] || u.title.de}</p>
                    <p className="text-xs text-muted">{formatDate(u.created_at.slice(0, 10), locale)}{u.hidden && ` · ${t('updates.hidden')}`}</p>
                  </div>
                  <button type="button" onClick={() => remove(u.id)} className="rounded p-1 text-muted hover:text-red-700" aria-label={t('updates.delete')}><Trash2 size={16} aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="liq-card p-6">
          <h2 className="text-lg font-bold text-navy">{t('questions.open')}</h2>
          {open.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t('questions.noOpen')}</p>
          ) : (
            <ul className="mt-4 space-y-5">
              {open.map((q) => (
                <li key={q.id} className="rounded-xl bg-cream p-4">
                  <p className="text-xs text-muted">{t('questions.investor')} · {formatDate(q.created_at.slice(0, 10), locale)}</p>
                  <p className="mt-1 text-sm text-body">{q.question}</p>
                  <div className="mt-3">
                    <TextareaField label={t('questions.answerLabel')} hint={t('questions.answerHint')} textareaProps={{ id: `a-${q.id}`, value: answers[q.id] ?? '', maxLength: 2000, onChange: (e) => setAnswers({ ...answers, [q.id]: e.target.value }) }} />
                    <div className="mt-2"><Button type="button" size="sm" onClick={() => answer(q.id)} disabled={answering === q.id}>{answering === q.id ? t('questions.answering') : t('questions.answer')}</Button></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="liq-card p-6">
          <h2 className="text-lg font-bold text-navy">{t('questions.answeredList')}</h2>
          {answered.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t('questions.empty')}</p>
          ) : (
            <ul className="mt-4 divide-y divide-navy/10">
              {answered.map((q) => (
                <li key={q.id} className="py-3 text-sm">
                  <p className="font-semibold text-navy">{q.question}</p>
                  <p className="mt-1 text-body">{q.answer}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
