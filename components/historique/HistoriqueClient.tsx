// components/historique/HistoriqueClient.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { annulerVente } from '@/app/actions/ventes';
import { formatFCFA } from '@/app/lib/format';

type LigneVente = {
  quantite: number;
  produits: { nom: string }[] | null;
};

type Vente = {
  id: string;
  montant_total: number;
  encaisse_par: 'moi' | 'garbashaw';
  mode_paiement: 'espece' | 'wave';
  statut_recupere: boolean;
  annulee: boolean;
  cree_le: string;
  ligne_ventes: LigneVente[];
};

const DELAI_ANNULATION_MS = 5 * 60 * 1000;

function peutAnnuler(vente: Vente, maintenant: number): boolean {
  if (vente.annulee) return false;
  const ecoule = maintenant - new Date(vente.cree_le).getTime();
  return ecoule < DELAI_ANNULATION_MS;
}

export function HistoriqueClient({ ventes }: { ventes: Vente[] }) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Force un re-rendu périodique pour désactiver "Annuler" une fois les 5 min écoulées
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setMaintenant(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  function handleAnnuler(vente: Vente) {
    const confirme = window.confirm('Annuler cette vente ? Le stock sera restitué.');
    if (!confirme) return;

    setErreur(null);
    startTransition(async () => {
      const result = await annulerVente(vente.id);
      if (!result.success) {
        setErreur(result.error ?? 'Erreur inconnue.');
      }
    });
  }

  if (ventes.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-400">Aucune vente enregistrée</p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-6 space-y-2.5">
      {erreur && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-1">
          <p className="text-sm text-red-600 font-medium">{erreur}</p>
        </div>
      )}

      {ventes.map((vente) => {
        const annulable = peutAnnuler(vente, maintenant);
        const heure = new Date(vente.cree_le).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const date = new Date(vente.cree_le).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        });

        return (
          <div
            key={vente.id}
            className={`bg-white border border-gray-100 rounded-2xl p-3.5 ${vente.annulee ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-gray-400">
                {date} · {heure}
                {vente.annulee && <span className="text-[#ff1111] font-semibold"> · annulée</span>}
              </span>
              <span className="font-mono font-bold text-[15px]">{formatFCFA(vente.montant_total)}</span>
            </div>

            <div className="flex items-center gap-1.5 mb-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  vente.encaisse_par === 'moi' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                }`}
              >
                {vente.encaisse_par === 'moi' ? 'Moi' : 'Garbashaw'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  vente.mode_paiement === 'espece' ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                {vente.mode_paiement === 'espece' ? 'Espèce' : 'Wave'}
              </span>
              {vente.encaisse_par === 'garbashaw' && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    vente.statut_recupere ? 'bg-green-50 text-green-600' : 'bg-red-50 text-[#ff1111]'
                  }`}
                >
                  {vente.statut_recupere ? 'Récupéré' : 'En attente'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400 truncate pr-2">
                {vente.ligne_ventes
                  .map((l) => `${l.quantite}× ${l.produits?.[0]?.nom ?? 'Produit supprimé'}`)
                  .join(', ')}
              </span>
              {!vente.annulee && (
                <button
                  onClick={() => handleAnnuler(vente)}
                  disabled={!annulable || isPending}
                  className="text-[11px] font-bold text-[#ff1111] disabled:text-gray-300 flex-shrink-0"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}