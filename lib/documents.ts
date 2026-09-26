import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { DocumentType } from '@/lib/projects/types';

export const DOCUMENT_BUCKET = 'project-documents';
export const DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;
export const DOCUMENT_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};
export const DOCUMENT_TYPES: DocumentType[] = ['contract', 'prospectus', 'valuation', 'financials', 'other'];

export interface DocumentRecord {
  id: string;
  project_id: string;
  investment_id: string | null;
  type: DocumentType;
  title: { de: string; en?: string };
  storage_path: string | null;
  version: number;
  sha256_hash: string | null;
  created_at: string;
}

/** Datei in den privaten Bucket laden, SHA-256 berechnen, Zeile in «documents» anlegen. */
export async function storeDocument(params: {
  projectId: string;
  type: DocumentType;
  title: { de: string; en: string };
  file: File;
}): Promise<{ ok: true; document: DocumentRecord } | { ok: false; error: string }> {
  const ext = DOCUMENT_MIME[params.file.type];
  if (!ext) return { ok: false, error: 'file_type' };
  if (params.file.size <= 0 || params.file.size > DOCUMENT_MAX_BYTES) return { ok: false, error: 'file_size' };

  const bytes = Buffer.from(await params.file.arrayBuffer());
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const admin = getSupabaseAdmin();

  // Version: fortlaufend pro Projekt und Titel (DE)
  const { data: existing } = await admin
    .from('documents')
    .select('version')
    .eq('project_id', params.projectId)
    .is('investment_id', null)
    .eq('title->>de', params.title.de)
    .order('version', { ascending: false })
    .limit(1);
  const version = (existing?.[0]?.version ?? 0) + 1;

  const path = `${params.projectId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, bytes, { contentType: params.file.type, upsert: false });
  if (uploadError) {
    console.error('[documents] upload:', uploadError.message);
    return { ok: false, error: 'upload' };
  }

  const { data, error } = await admin
    .from('documents')
    .insert({
      project_id: params.projectId,
      type: params.type,
      title: params.title,
      storage_path: path,
      version,
      sha256_hash: sha256,
    })
    .select('*')
    .single();
  if (error || !data) {
    await admin.storage.from(DOCUMENT_BUCKET).remove([path]);
    console.error('[documents] insert:', error?.message);
    return { ok: false, error: 'server' };
  }
  return { ok: true, document: data as DocumentRecord };
}

export async function deleteDocument(doc: DocumentRecord): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('documents').delete().eq('id', doc.id);
  if (error) {
    console.error('[documents] delete:', error.message);
    return false;
  }
  if (doc.storage_path) await admin.storage.from(DOCUMENT_BUCKET).remove([doc.storage_path]);
  return true;
}

/** Kurz gültiger, signierter Download-Link (60 Sekunden). */
export async function signedDocumentUrl(storagePath: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage.from(DOCUMENT_BUCKET).createSignedUrl(storagePath, 60);
  if (error) {
    console.error('[documents] signed url:', error.message);
    return null;
  }
  return data.signedUrl;
}

export async function getDocumentById(id: string): Promise<DocumentRecord | null> {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from('documents').select('*').eq('id', id).maybeSingle();
  return (data as DocumentRecord | null) ?? null;
}
