'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import Button from '@/components/ui/Button';

export default function NewProjectButton() {
  const t = useTranslations('emittent.dashboard');
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/emittent/projekte', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) router.push(`/emittent/projekte/${data.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={create} disabled={busy}>
      <Plus size={16} aria-hidden="true" />
      {busy ? t('creating') : t('newProject')}
    </Button>
  );
}
