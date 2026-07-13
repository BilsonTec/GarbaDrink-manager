/* eslint-disable react/no-unescaped-entities */
// app/(app)/le-point/page.tsx
import { createClient } from '@/app/lib/supabase/server';
import { formatFCFA } from '@/app/lib/format';
import { SolderButton } from '@/components/lepoint/SolderButton';

export default async function LePointPage() {
  const supabase = await createClient();

  // On récupère chaque vente active avec ses lignes (jointure via la FK
  // ligne_ventes.vente_id -> ventes.id, détectée automatiquement par Supabase).
  const { data: ventes, error } = await supabase
    .from('ventes')
    .select(
      'id, montant_total, encaisse_par, mode_paiement, statut_recupere, ligne_ventes(quantite, prix_unitaire_achat)'
    )
    .eq('annulee', false);

  if (error) {
    return <p className="px-5 text-sm text-[#ff1111]">Erreur : {error.message}</p>;
  }

  const actives = ventes ?? [];

  const especeMoi = actives
    .filter((v) => v.encaisse_par === 'moi' && v.mode_paiement === 'espece')
    .reduce((s, v) => s + v.montant_total, 0);

  const waveMoi = actives
    .filter((v) => v.encaisse_par === 'moi' && v.mode_paiement === 'wave')
    .reduce((s, v) => s + v.montant_total, 0);

  const creanceGarbashawEspece = actives
    .filter((v) => v.encaisse_par === 'garbashaw' && v.mode_paiement === 'espece' && !v.statut_recupere)
    .reduce((s, v) => s + v.montant_total, 0);

  const creanceGarbashawWave = actives
    .filter((v) => v.encaisse_par === 'garbashaw' && v.mode_paiement === 'wave' && !v.statut_recupere)
    .reduce((s, v) => s + v.montant_total, 0);

  const caBrut = actives.reduce((s, v) => s + v.montant_total, 0);

  const coutAchat = actives.reduce((s, v) => {
    const coutLignes = (v.ligne_ventes ?? []).reduce(
      (ss, l) => ss + l.quantite * l.prix_unitaire_achat,
      0
    );
    return s + coutLignes;
  }, 0);

  const beneficeNet = caBrut - coutAchat;

  const hasCreancesEnAttente = actives.some(
    (v) => v.encaisse_par === 'garbashaw' && !v.statut_recupere
  );

  return (
    <>
      <div className="px-5 pb-3 text-sm font-bold">Où se trouve l'argent</div>
      <div className="grid grid-cols-2 gap-2.5 px-5 mb-5">
        <FluxCard label="Espèce physique" valeur={especeMoi} />
        <FluxCard label="Wave personnel" valeur={waveMoi} />
        <FluxCard label="Créance Garbashaw (Espèce)" valeur={creanceGarbashawEspece} />
        <FluxCard label="Créance Garbashaw (Wave)" valeur={creanceGarbashawWave} />
      </div>

      <div className="px-5 pb-3 text-sm font-bold">Rentabilité</div>
      <div className="mx-5 mb-5 bg-[#16161a] rounded-[18px] p-4.5 text-white">
        <RentabRow label="Chiffre d'affaires brut" valeur={formatFCFA(caBrut)} />
        <RentabRow label="Coût d'achat marchandises" valeur={`- ${formatFCFA(coutAchat)}`} />
        <div className="border-t border-white/15 mt-1.5 pt-3 flex justify-between font-extrabold text-[15px]">
          <span>Bénéfice net</span>
          <span className="font-mono text-[#ff1111]">{formatFCFA(beneficeNet)}</span>
        </div>
      </div>

      <SolderButton hasCreancesEnAttente={hasCreancesEnAttente} />
    </>
  );
}

function FluxCard({ label, valeur }: { label: string; valeur: number }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3.5">
      <div className="text-[10.5px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">{label}</div>
      <div className="font-mono font-bold text-[16px]">{formatFCFA(valeur)}</div>
    </div>
  );
}

function RentabRow({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex justify-between py-1.5 text-[12.5px]">
      <span>{label}</span>
      <span className="font-mono">{valeur}</span>
    </div>
  );
}