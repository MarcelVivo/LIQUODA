import { NextResponse } from 'next/server';
import { adminActorLabel, getAdminSession } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) return { error: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) };
  return { session, actor: adminActorLabel(session), admin: getSupabaseAdmin() };
}
