'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

const items = [
  { href: '/admin', label: 'Registrierungen' },
  { href: '/admin/nutzer', label: 'Nutzer' },
  { href: '/admin/projekte', label: 'Projekte' },
  { href: '/admin/audit', label: 'Audit-Log' },
];

export default function AdminNav({ title }: { title: string }) {
  const pathname = usePathname();
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.35em] uppercase text-gray-400">LIQUODA Admin</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#0b1830]">{title}</h1>
        </div>
        <LogoutButton />
      </div>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Admin-Navigation">
        {items.map((it) => {
          const active = it.href === '/admin' ? pathname === '/admin' : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                'rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors',
                active ? 'bg-[#0b1830] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400',
              ].join(' ')}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
