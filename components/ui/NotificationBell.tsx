// components/ui/NotificationBell.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

type Alerte = { id: string; nom: string; stock: number; seuil: number };

export function NotificationBell({ alertes }: { alertes: Alerte[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center relative transition-colors"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
          <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {alertes.length > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-sm">
            {alertes.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-72 bg-white border border-gray-100 rounded-2xl shadow-lg shadow-gray-100/50 py-2 z-20 max-h-80 overflow-y-auto">
          <div className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Alertes stock
          </div>
          {alertes.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mx-auto mb-2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p className="text-sm text-gray-400">Tout est en ordre</p>
            </div>
          ) : (
            alertes.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">{a.nom}</span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    a.stock === 0 
                      ? 'bg-red-50 text-red-600' 
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {a.stock === 0 ? 'Rupture' : `${a.stock} restant${a.stock > 1 ? 's' : ''}`}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}