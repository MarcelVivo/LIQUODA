'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 hover:text-gray-600 transition-colors"
    >
      Logout
    </button>
  );
}
