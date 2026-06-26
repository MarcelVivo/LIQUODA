import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const validEmail = (process.env.ADMIN_EMAIL ?? '').trim();
    const validPassword = (process.env.ADMIN_PASSWORD ?? '').trim();

    if (!validEmail || !validPassword) {
      console.error('ADMIN_EMAIL or ADMIN_PASSWORD env var is not set');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if ((email ?? '').trim() !== validEmail || (password ?? '') !== validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const jwtSecret = (process.env.JWT_SECRET ?? '').trim();
    if (!jwtSecret) {
      console.error('JWT_SECRET env var is not set');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const token = await new SignJWT({ email: validEmail })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
