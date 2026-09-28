import { getSupabaseAdmin } from '@/lib/supabase';

/** Bilder für Projekte (Titelbild, Galerie) und Emittenten (Logo/Porträt). Öffentlicher Bucket, Schreiben nur über das Backend. */
export const IMAGE_BUCKET = 'project-images';
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const GALLERY_MAX = 4;
export const IMAGE_MIME: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Öffentliche URL eines Storage-Pfads oder eines mitgelieferten Beispielbilds (oder null). */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^\/images\/examples\/[a-z0-9-]+\.webp$/.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  return base ? `${base}/storage/v1/object/public/${IMAGE_BUCKET}/${path}` : null;
}

export async function storeImage(folder: string, file: File): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const ext = IMAGE_MIME[file.type];
  if (!ext) return { ok: false, error: 'file_type' };
  if (file.size <= 0 || file.size > IMAGE_MAX_BYTES) return { ok: false, error: 'file_size' };
  const bytes = Buffer.from(await file.arrayBuffer());
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await getSupabaseAdmin().storage.from(IMAGE_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false, cacheControl: '31536000' });
  if (error) {
    console.error('[images] upload:', error.message);
    return { ok: false, error: 'upload' };
  }
  return { ok: true, path };
}

export async function removeImage(path: string | null | undefined): Promise<void> {
  if (!path || path.startsWith('/images/examples/')) return;
  await getSupabaseAdmin().storage.from(IMAGE_BUCKET).remove([path]);
}
