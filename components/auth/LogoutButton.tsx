'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LogoutButton() {
  const t = useTranslations('auth.account');
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/konto/logout', { method: 'POST', headers: { 'x-locale': locale } });
      const data = await res.json().catch(() => ({}));
      router.push(data.redirect ?? '/');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={logout} disabled={busy}>
      <LogOut size={16} aria-hidden="true" />
      {busy ? t('loggingOut') : t('logout')}
    </Button>
  );
}
