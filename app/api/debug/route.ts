import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseAdmin();

  const insertResult = await supabase.from('registrations').insert({
    role: 'Investor',
    first_name: 'Debug',
    last_name: 'Test',
    email: `debug-${Date.now()}@test.com`,
  });

  const selectResult = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    insert: {
      error: insertResult.error,
      status: insertResult.status,
      statusText: insertResult.statusText,
    },
    select: {
      data: selectResult.data,
      error: selectResult.error,
      status: selectResult.status,
    },
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'MISSING',
      keyPrefix: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').slice(0, 15) || 'MISSING',
    },
  });
}
