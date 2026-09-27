'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/images/ImageUploader';
import { imageUrl } from '@/lib/images';

/** Logo oder Porträt des Emittenten (freiwillig). */
export default function AvatarUploader({ avatarPath }: { avatarPath: string | null }) {
  const t = useTranslations('emittent.dashboard.avatar');
  const router = useRouter();
  const [path, setPath] = useState(avatarPath);

  const upload = async (file: File) => {
    const form = new FormData();
    form.set('file', file);
    const res = await fetch('/api/emittent/profilbild', { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return (data.error as string) || 'server';
    setPath(data.path);
    router.refresh();
    return null;
  };
  const remove = async () => {
    const res = await fetch('/api/emittent/profilbild', { method: 'DELETE' });
    if (!res.ok) return 'server';
    setPath(null);
    router.refresh();
    return null;
  };

  return (
    <div className="liq-card mt-6 p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('title')}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t('lead')}</p>
      <div className="mt-4">
        <ImageUploader images={path ? [{ path, url: imageUrl(path) ?? '' }] : []} max={1} editable upload={upload} remove={remove} shape="square" />
      </div>
    </div>
  );
}
