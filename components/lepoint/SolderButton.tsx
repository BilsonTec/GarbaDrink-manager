// components/lepoint/SolderButton.tsx
'use client';

import { useTransition, useState } from 'react';
import { solderPoint } from '@/app/actions/lepoint';

export function SolderButton({ hasCreancesEnAttente }: { hasCreancesEnAttente: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function handleClick() {
    const confirme = window.confirm(
      "Confirmer la réception de l'argent détenu par Garbashaw ? Les créances passeront à 'récupéré'."
    );
    if (!confirme) return;

    setErreur(null);
    startTransition(async () => {
      const result = await solderPoint();
      if (!result.success) {
        setErreur(result.error ?? 'Erreur inconnue.');
      }
    });
  }

  return (
    <div className="px-5">
      {erreur && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-3 text-sm text-[#ff1111] font-medium">
          {erreur}
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={!hasCreancesEnAttente || isPending}
        className="w-full bg-red-50 text-[#ff1111] border border-red-100 rounded-2xl py-3.5 font-bold text-[13.5px] disabled:opacity-40"
      >
        {isPending ? 'Solde en cours...' : 'Solder le point avec Garbashaw'}
      </button>
    </div>
  );
}