import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithToken } from '@/lib/admin-password';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const token = typeof body.token === 'string' && /^[0-9a-f]{64}$/.test(body.token) ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!token || password.length < 10 || password.length > 128) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }
  const ok = await resetPasswordWithToken(token, password);
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'token_invalid' }, { status: 400 });
}
