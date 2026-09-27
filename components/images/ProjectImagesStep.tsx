'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/images/ImageUploader';
import { imageUrl } from '@/lib/images';

/** Wizard-Schritt «Bilder»: Titelbild (Pflicht) und Galerie (bis 4). */
export default function ProjectImagesStep({
  projectId,
  editable,
  cover,
  gallery,
  onChange,
}: {
  projectId: string;
  editable: boolean;
  cover: string | null;
  gallery: string[];
  onChange: (cover: string | null, gallery: string[]) => void;
}) {
  const t = useTranslations('emittent.wizard.images');
  const router = useRouter();
  const [state, setState] = useState({ cover, gallery });

  const apply = (next: { cover: string | null; gallery: string[] }) => {
    setState(next);
    onChange(next.cover, next.gallery);
    router.refresh();
  };

  const upload = (kind: 'cover' | 'gallery') => async (file: File) => {
    const form = new FormData();
    form.set('projectId', projectId);
    form.set('kind', kind);
    form.set('file', file);
    const res = await fetch('/api/emittent/bilder', { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return (data.error as string) || 'server';
    apply(kind === 'cover' ? { ...state, cover: data.path } : { ...state, gallery: [...state.gallery, data.path] });
    return null;
  };

  const remove = async (path: string) => {
    const res = await fetch('/api/emittent/bilder', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, path }) });
    if (!res.ok) return 'server';
    apply(state.cover === path ? { ...state, cover: null } : { ...state, gallery: state.gallery.filter((p) => p !== path) });
    return null;
  };

  const toImg = (p: string) => ({ path: p, url: imageUrl(p) ?? '' });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-bold text-navy">{t('coverTitle')}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t('coverLead')}</p>
        <div className="mt-4">
          <ImageUploader images={state.cover ? [toImg(state.cover)] : []} max={1} editable={editable} upload={upload('cover')} remove={remove} shape="wide" />
        </div>
      </div>
      <div>
        <h3 className="text-base font-bold text-navy">{t('galleryTitle')}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t('galleryLead')}</p>
        <div className="mt-4">
          <ImageUploader images={state.gallery.map(toImg)} max={4} editable={editable} upload={upload('gallery')} remove={remove} shape="square" />
        </div>
      </div>
    </div>
  );
}
