'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PasswordInput from '@/components/ui/PasswordInput';

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0b1830] transition-colors';

/** Neues Admin-Passwort setzen (Link aus der E-Mail) oder Link anfordern. */
function AdminPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const request = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    await fetch('/api/auth/passwort-vergessen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    setBusy(false);
    setMsg('Falls die Adresse zum Admin-Konto gehört, ist eine E-Mail mit dem Link unterwegs. Der Link ist 60 Minuten gültig.');
  };

  const setNew = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 10) return setError('Das Passwort muss mindestens 10 Zeichen lang sein.');
    if (password !== password2) return setError('Die Passwörter stimmen nicht überein.');
    setBusy(true);
    const res = await fetch('/api/auth/passwort-setzen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    setBusy(false);
    if (!res.ok) return setError('Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.');
    setMsg('Passwort gesetzt. Sie werden zum Login weitergeleitet.');
    setTimeout(() => router.push('/admin/login'), 1500);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }} className="text-center text-2xl font-normal tracking-wide text-[#0b1830] mb-8">
          Liquoda<span className="font-bold">.-</span>
        </p>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-400 mb-6">{token ? 'Neues Passwort' : 'Passwort vergessen'}</p>
          {msg ? (
            <p className="text-sm text-gray-700">{msg}</p>
          ) : token ? (
            <form onSubmit={setNew} className="flex flex-col gap-4">
              <PasswordInput placeholder="Neues Passwort (min. 10 Zeichen)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
              <PasswordInput placeholder="Neues Passwort wiederholen" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" className={inputClass} />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button type="submit" disabled={busy} className="mt-1 w-full py-2.5 bg-[#0b1830] text-white text-xs font-medium tracking-[0.2em] uppercase rounded-lg hover:opacity-90 disabled:opacity-50">
                {busy ? '…' : 'Passwort setzen'}
              </button>
            </form>
          ) : (
            <form onSubmit={request} className="flex flex-col gap-4">
              <p className="text-sm text-gray-600">Geben Sie die Admin-E-Mail-Adresse ein. Sie erhalten einen Link, mit dem Sie ein neues Passwort setzen können.</p>
              <input type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
              <button type="submit" disabled={busy} className="mt-1 w-full py-2.5 bg-[#0b1830] text-white text-xs font-medium tracking-[0.2em] uppercase rounded-lg hover:opacity-90 disabled:opacity-50">
                {busy ? '…' : 'Link senden'}
              </button>
            </form>
          )}
          <a href="/admin/login" className="mt-6 block text-center text-xs text-gray-400 hover:text-gray-600">Zurück zum Login</a>
        </div>
      </div>
    </div>
  );
}

export default function AdminPasswordPage() {
  return (
    <Suspense fallback={null}>
      <AdminPasswordForm />
    </Suspense>
  );
}
