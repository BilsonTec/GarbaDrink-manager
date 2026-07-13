// components/PWAProvider.tsx
'use client';

import { useEffect } from 'react';
import { SplashScreen } from './ui/SplashScreen';

/**
 * Event dispatched when the browser is ready to allow app installation
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Composant pour registrer le Service Worker et initialiser la PWA
 */
export function PWAProvider() {
  useEffect(() => {
    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker enregistré:', registration.scope);

          // Vérifier les mises à jour toutes les heures
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
        });

      // Écouter les mises à jour
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Le Service Worker a été mis à jour');
        // Optionnel: recharger la page pour appliquer les mises à jour
        // window.location.reload();
      });
    }

    // Initialiser IndexedDB pour offline
    if ('indexedDB' in window) {
      console.log('[PWA] IndexedDB disponible pour le cache offline');
    }

    // Ajouter le listener pour l'événement "beforeinstallprompt"
    let deferredPrompt: BeforeInstallPromptEvent | null = null;
    
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      console.log('[PWA] Événement beforeinstallprompt déclenché');
      event.preventDefault();
      deferredPrompt = event;

      // Optionnel: ajouter un bouton dans l'UI pour installer l'app
      // Cela peut être fait comme signal pour montrer un bouton "Installer"
      window.dispatchEvent(
        new CustomEvent('pwa-prompt-available', { detail: deferredPrompt })
      );
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    // Écouter l'installation de l'app
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] L\'application a été installée');
      deferredPrompt = null;
    });

    // Détecter si l'app est en standalone (lancée comme app installée)
    const navigatorWithStandalone = window.navigator as (Navigator & { standalone?: boolean });
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      navigatorWithStandalone.standalone === true;

    if (isStandalone) {
      console.log('[PWA] L\'application s\'exécute en mode standalone');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  return <SplashScreen />;
}
