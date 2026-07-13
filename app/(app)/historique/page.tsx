// app/(app)/historique/page.tsx
import { getVentesHistorique } from '@/app/lib/supabase/queries';
import { HistoriqueClient, type Vente } from '@/components/historique/HistoriqueClient';

export const revalidate = 15;

export default async function HistoriquePage() {
  const { data: ventes, error } = await getVentesHistorique();

  if (error) {
    return <p className="px-5 text-sm text-[#ff1111]">Erreur : {error.message}</p>;
  }

  return (
    <>
      <div className="px-5 pb-4">
        <h2 className="text-base font-bold text-gray-900">Historique des ventes</h2>
        <p className="text-xs text-gray-400 mt-0.5">Annulation possible dans les 5 minutes</p>
      </div>
      <HistoriqueClient ventes={(ventes ?? []) as Vente[]} />
    </>
  );
}