/* eslint-disable react/no-unescaped-entities */
// app/(app)/le-point/page.tsx
import { createClient } from '@/app/lib/supabase/server';
import { formatFCFA } from '@/app/lib/format';
import { SolderButton } from '@/components/lepoint/SolderButton';

export const revalidate = 15;

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

  const {
    especeMoi,
    waveMoi,
    creanceGarbashawEspece,
    creanceGarbashawWave,
    caBrut,
    coutAchat,
    hasCreancesEnAttente,
  } = actives.reduce(
    (acc, vente) => {
      const montant = vente.montant_total;
      const isGarbashaw = vente.encaisse_par === 'garbashaw';
      const isRecupere = vente.statut_recupere;
      const isEspece = vente.mode_paiement === 'espece';

      if (vente.encaisse_par === 'moi') {
        if (isEspece) acc.especeMoi += montant;
        else acc.waveMoi += montant;
      } else if (isGarbashaw && !isRecupere) {
        if (isEspece) acc.creanceGarbashawEspece += montant;
        else acc.creanceGarbashawWave += montant;
      }

      acc.caBrut += montant;
      acc.hasCreancesEnAttente ||= isGarbashaw && !isRecupere;
      acc.coutAchat += (vente.ligne_ventes ?? []).reduce(
        (ss, l) => ss + l.quantite * l.prix_unitaire_achat,
        0
      );

      return acc;
    },
    {
      especeMoi: 0,
      waveMoi: 0,
      creanceGarbashawEspece: 0,
      creanceGarbashawWave: 0,
      caBrut: 0,
      coutAchat: 0,
      hasCreancesEnAttente: false,
    }
  );

  const beneficeNet = caBrut - coutAchat;

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