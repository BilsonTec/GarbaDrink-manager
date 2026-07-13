// next.config.ts
import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['localhost:3000', '192.168.1.23:3000'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'edwangzyjzscqayvwrvk.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Utiliser webpack au lieu de Turbopack (next-pwa n'est pas compatible avec Turbopack)
  turbopack: {},
};

const withPWAConfig = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWAConfig(nextConfig);