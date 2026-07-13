// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GarbaDrinks Manager',
    short_name: 'GarbaDrinks',
    description: 'Gestion de caisse, stock et rentabilité pour point de vente de boissons fraîches. Fonctionne hors ligne.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#ff1111',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Point de Vente',
        short_name: 'POS',
        description: 'Accès direct à l\'écran de caisse',
        url: '/le-point',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
          },
        ],
      },
      {
        name: 'Historique',
        short_name: 'Historique',
        description: 'Voir l\'historique des ventes',
        url: '/historique',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
          },
        ],
      },
    ],
    categories: ['business', 'productivity'],
    screenshots: [
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'narrow',
      },
    ],
  };
}