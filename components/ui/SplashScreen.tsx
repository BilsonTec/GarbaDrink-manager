// components/ui/SplashScreen.tsx
'use client';

import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Attendre que la page soit chargée avant de masquer le splash
    const handleLoad = () => {
      setTimeout(() => setIsVisible(false), 1000);
    };

    // Si la page est déjà chargée (hydratation côté client)
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      {/* Logo avec animation */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-24 h-24">
          {/* Logo SVG ou image */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full text-red-600 animate-pulse"
            fill="currentColor"
          >
            {/* Cercle pour imiter une application */}
            <circle cx="50" cy="50" r="45" fill="white" stroke="currentColor" strokeWidth="2" />
            {/* GarbaDrinks initial ou icône */}
            <text
              x="50"
              y="65"
              textAnchor="middle"
              fontSize="40"
              fontWeight="bold"
              fill="currentColor"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              G
            </text>
          </svg>
        </div>

        {/* Indicateur de chargement */}
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>

        {/* Texte */}
        <p className="text-sm font-medium text-gray-700 mt-2">GarbaDrinks</p>
      </div>
    </div>
  );
}
