// components/ui/TabBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  {
    href: '/',
    label: 'Accueil',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
      </svg>
    ),
  },
  {
    href: '/stock',
    label: 'Stock',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </svg>
    ),
  },
  {
    href: '/le-point',
    label: 'Le Point',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="7" width="4" height="13" rx="1" />
        <rect x="16" y="3" width="4" height="17" rx="1" />
      </svg>
    ),
  },
  {
    href: '/historique',
    label: 'Historique',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white/95 backdrop-blur-lg border-t border-gray-100 flex px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      {TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center gap-1 py-1 relative group transition-all duration-200 ${
              active ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {/* Indicateur actif */}
            {active && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
            )}
            
            {/* Icône avec effet de scale */}
            <span className={`w-[22px] h-[22px] transition-transform duration-200 ${
              active ? 'scale-110' : 'group-hover:scale-105'
            }`}>
              {tab.icon}
            </span>
            
            {/* Label */}
            <span className={`text-[10px] font-semibold tracking-tight transition-all duration-200 ${
              active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
            }`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}