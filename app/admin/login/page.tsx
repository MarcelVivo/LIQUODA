'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/admin');
    } else {
      setError('E-Mail oder Passwort ungültig.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          className="text-center text-2xl font-normal tracking-wide text-[#0b1830] mb-8"
        >
          Liquoda<span className="font-bold">.-</span>
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-400 mb-6">
            Admin Login
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0b1830] transition-colors"
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0b1830] transition-colors"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-2.5 bg-[#0b1830] text-white text-xs font-medium tracking-[0.2em] uppercase rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '...' : 'Einloggen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
