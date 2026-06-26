import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { role, firstName, lastName, email } = await req.json();

  if (!role || !firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().from('registrations').insert({
    role,
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    email: email.trim().toLowerCase(),
  });

  if (error) {
    console.error('Supabase insert error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
