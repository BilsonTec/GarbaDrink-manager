// app/(app)/historique/page.tsx
import { createClient } from '@/app/lib/supabase/server';
import { HistoriqueClient } from '@/components/historique/HistoriqueClient';

export default async function HistoriquePage() {
  const supabase = await createClient();

  const { data: ventes, error } = await supabase
    .from('ventes')
    .select(
      'id, montant_total, encaisse_par, mode_paiement, statut_recupere, annulee, cree_le, ligne_ventes(quantite, produits(nom))'
    )
    .order('cree_le', { ascending: false });

  if (error) {
    return <p className="px-5 text-sm text-[#ff1111]">Erreur : {error.message}</p>;
  }

  return (
    <>
      <div className="px-5 pb-4">
        <h2 className="text-base font-bold text-gray-900">Historique des ventes</h2>
        <p className="text-xs text-gray-400 mt-0.5">Annulation possible dans les 5 minutes</p>
      </div>
      <HistoriqueClient ventes={ventes ?? []} />
    </>
  );
}