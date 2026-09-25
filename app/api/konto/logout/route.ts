import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  if (hasSupabaseEnv()) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const locale = req.headers.get('x-locale') === 'en' ? '/en' : '';
  return NextResponse.json({ success: true, redirect: `${locale}/` });
}
