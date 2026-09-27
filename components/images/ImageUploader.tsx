'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImagePlus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Bild-Upload mit Vorschau. `upload` sendet die Datei, `remove` löscht ein Bild.
 * Wird für Titelbild, Galerie und Emittenten-Bild verwendet.
 */
export default function ImageUploader({
  images,
  max = 1,
  editable,
  upload,
  remove,
  shape = 'wide',
}: {
  images: { path: string; url: string }[];
  max?: number;
  editable: boolean;
  upload: (file: File) => Promise<string | null>; // liefert Fehlercode oder null
  remove: (path: string) => Promise<string | null>;
  shape?: 'wide' | 'square';
}) {
  const t = useTranslations('images');
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(undefined);
    const code = await upload(file);
    if (code) setError(t(`errors.${['file_type', 'file_size', 'gallery_full', 'locked'].includes(code) ? code : 'server'}`));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onRemove = async (path: string) => {
    setBusy(true);
    const code = await remove(path);
    if (code) setError(t('errors.server'));
    setBusy(false);
  };

  const box = shape === 'square' ? 'aspect-square w-32' : 'aspect-video w-full max-w-md';

  return (
    <div>
      <div className="flex flex-wrap gap-4">
        {images.map((img) => (
          <div key={img.path} className={`relative overflow-hidden rounded-xl bg-cream-dark ${box}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            {editable && (
              <button type="button" onClick={() => onRemove(img.path)} disabled={busy} aria-label={t('remove')} className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-navy shadow hover:text-red-700">
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {editable && images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy/20 text-muted transition-colors hover:border-accent hover:text-navy ${box}`}
          >
            <ImagePlus size={24} aria-hidden="true" />
            <span className="text-xs font-semibold">{busy ? t('uploading') : t('add')}</span>
          </button>
        )}
      </div>
      {editable && <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />}
      {editable && <p className="mt-2 text-xs text-muted">{t('hint')}</p>}
      {error && (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
      {!editable && images.length === 0 && <p className="text-xs text-muted">{t('none')}</p>}
      {editable && images.length === 0 && max === 1 && (
        <p className="sr-only">
          <Button type="button" size="sm" onClick={() => inputRef.current?.click()}>{t('add')}</Button>
        </p>
      )}
    </div>
  );
}
