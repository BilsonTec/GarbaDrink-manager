// app/(auth)/login/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/client';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      setError('Email et mot de passe requis.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connexion expirée')), 20000)
      );
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const { data, error } = (await Promise.race([loginPromise, timeoutPromise])) as any;

      if (error) {
        setError(error.message || 'Erreur de connexion.');
        return;
      }
      if (!data?.session) {
        setError('Email ou mot de passe incorrect.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(`${errorMsg} Veuillez réessayer.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="mb-12 mt-[-20%]">
            <Image src="/logo.png" alt="GarbaDrinks Manager" width={180} height={48} className="mx-auto" priority />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">Connexion</h1>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 rounded-lg px-4 py-4">
                <p className="text-sm text-red-700 font-semibold">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="votre@email.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-0 transition-colors"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-0 transition-colors"
                style={{ fontSize: '16px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-2xl py-4 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>

      <div className="pb-8 text-center">
        <p className="text-xs text-gray-400">GarbaDrinks Manager © {new Date().getFullYear()}</p>
      </div>

      <style jsx global>{`
        input, select, textarea { font-size: 16px !important; }
      `}</style>
    </div>
  );
}