// app/actions/ventes.ts
'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ArticlePanier = {
  produitId: string;
  quantite: number;
};

type EncaissePar = 'moi' | 'garbashaw';
type ModePaiement = 'espece' | 'wave';

export async function confirmerVente(
  articles: ArticlePanier[],
  encaissePar: EncaissePar,
  modePaiement: ModePaiement
) {
  if (articles.length === 0) {
    return { success: false, error: 'Le panier est vide.' };
  }

  const supabase = await createClient();

  // On relit les prix actuels en base plutôt que de faire confiance au client :
  // évite qu'un prix affiché soit périmé (produit modifié entre-temps).
  const produitIds = articles.map((a) => a.produitId);
  const { data: produits, error: produitsError } = await supabase
    .from('produits')
    .select('id, prix_achat, prix_vente, stock_actuel, nom')
    .in('id', produitIds);

  if (produitsError || !produits) {
    return { success: false, error: 'Impossible de vérifier les produits.' };
  }

  // Vérification du stock avant même d'insérer (le trigger SQL vérifie aussi,
  // mais on préfère un message clair côté UI plutôt qu'une erreur SQL brute).
  for (const article of articles) {
    const produit = produits.find((p) => p.id === article.produitId);
    if (!produit) {
      return { success: false, error: 'Un produit du panier n\'existe plus.' };
    }
    if (article.quantite > produit.stock_actuel) {
      return { success: false, error: `Stock insuffisant pour ${produit.nom}.` };
    }
  }

  const montantTotal = articles.reduce((somme, article) => {
    const produit = produits.find((p) => p.id === article.produitId)!;
    return somme + produit.prix_vente * article.quantite;
  }, 0);

  // 1. Créer l'en-tête de vente
  const { data: vente, error: venteError } = await supabase
    .from('ventes')
    .insert({
      montant_total: montantTotal,
      encaisse_par: encaissePar,
      mode_paiement: modePaiement,
    })
    .select('id')
    .single();

  if (venteError || !vente) {
    return { success: false, error: 'Erreur lors de la création de la vente.' };
  }

  // 2. Créer les lignes de vente
  // Le trigger PostgreSQL decrementer_stock() décrémente automatiquement
  // produits.stock_actuel à chaque insertion ici (voir étape 1 du projet).
  const lignes = articles.map((article) => {
    const produit = produits.find((p) => p.id === article.produitId)!;
    return {
      vente_id: vente.id,
      produit_id: article.produitId,
      quantite: article.quantite,
      prix_unitaire_achat: produit.prix_achat,
      prix_unitaire_vente: produit.prix_vente,
    };
  });

  const { error: lignesError } = await supabase.from('ligne_ventes').insert(lignes);

  if (lignesError) {
    // Le trigger peut rejeter l'insertion si le stock est devenu insuffisant
    // entre notre vérification et maintenant (rare, mais possible en usage concurrent).
    await supabase.from('ventes').delete().eq('id', vente.id);
    return { success: false, error: 'Stock insuffisant au moment de la validation.' };
  }

  // Revalide toutes les pages concernées : le catalogue (stock a changé),
  // et le layout (la cloche d'alertes doit se mettre à jour aussi).
  revalidatePath('/', 'layout');

  return { success: true };
}


// ---------------------------------------------------------------------------
// Annuler une vente récente (dans les 5 minutes)
// ---------------------------------------------------------------------------

const DELAI_ANNULATION_MS = 5 * 60 * 1000; // 5 minutes

export async function annulerVente(venteId: string) {
  const supabase = await createClient();

  const { data: vente, error: venteError } = await supabase
    .from('ventes')
    .select('id, annulee, cree_le, ligne_ventes(produit_id, quantite)')
    .eq('id', venteId)
    .single();

  if (venteError || !vente) {
    return { success: false, error: 'Vente introuvable.' };
  }

  if (vente.annulee) {
    return { success: false, error: 'Cette vente est déjà annulée.' };
  }

  const ecouleMs = Date.now() - new Date(vente.cree_le).getTime();
  if (ecouleMs > DELAI_ANNULATION_MS) {
    return { success: false, error: 'Le délai de 5 minutes pour annuler cette vente est dépassé.' };
  }

  // Restitue le stock de chaque ligne, produit par produit
  for (const ligne of vente.ligne_ventes) {
    if (!ligne.produit_id) continue; // produit supprimé entre-temps (rare, ON DELETE SET NULL)

    const { data: produit } = await supabase
      .from('produits')
      .select('stock_actuel')
      .eq('id', ligne.produit_id)
      .single();

    if (produit) {
      await supabase
        .from('produits')
        .update({ stock_actuel: produit.stock_actuel + ligne.quantite })
        .eq('id', ligne.produit_id);
    }
  }

  const { error: updateError } = await supabase
    .from('ventes')
    .update({ annulee: true })
    .eq('id', venteId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/le-point');
  revalidatePath('/historique');
  return { success: true };
}