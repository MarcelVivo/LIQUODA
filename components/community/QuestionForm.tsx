'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { TextareaField } from '@/components/ui/Field';

export default function QuestionForm({ projectId }: { projectId: string }) {
  const t = useTranslations('community.questions');
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (question.trim().length < 10 || question.length > 1000) return setError(t('errors.length'));
    setBusy(true);
    setError(undefined);
    const res = await fetch('/api/fragen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, question }) });
    setBusy(false);
    if (!res.ok) return setError(t('errors.server'));
    setSent(true);
    router.refresh();
  };

  if (sent) return <p className="rounded-lg bg-cream px-4 py-3 text-sm text-body" role="status">{t('sent')}</p>;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{t('askLead')}</p>
      <TextareaField label={t('askTitle')} error={error} textareaProps={{ id: 'q-text', value: question, maxLength: 1000, placeholder: t('placeholder'), onChange: (e) => setQuestion(e.target.value) }} />
      <Button type="submit" size="sm" disabled={busy}>{busy ? t('sending') : t('send')}</Button>
    </form>
  );
}
