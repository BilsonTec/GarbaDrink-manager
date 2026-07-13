// app/actions/produits.ts
'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------------------------
// Ajouter un nouveau produit (avec upload optionnel d'une photo)
// ---------------------------------------------------------------------------
export async function ajouterProduit(formData: FormData) {
  const supabase = await createClient();

  const nom = String(formData.get('nom') ?? '').trim();
  const prixAchat = Number(formData.get('prixAchat'));
  const prixVente = Number(formData.get('prixVente'));
  const stock = Number(formData.get('stock')) || 0;
  const seuil = Number(formData.get('seuil')) || 5;
  const image = formData.get('image') as File | null;

  if (!nom || !prixAchat || !prixVente) {
    return { success: false, error: 'Nom, prix d\'achat et prix de vente sont requis.' };
  }

  let imageUrl: string | null = null;

  // Upload de la photo si l'utilisateur en a fourni une
  if (image && image.size > 0) {
    const extension = image.name.split('.').pop();
    const chemin = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('produits-images')
      .upload(chemin, image, { contentType: image.type });

    if (uploadError) {
      return { success: false, error: `Échec de l'upload de l'image : ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from('produits-images')
      .getPublicUrl(chemin);

    imageUrl = publicUrlData.publicUrl;
  }

  const { error } = await supabase.from('produits').insert({
    nom,
    prix_achat: prixAchat,
    prix_vente: prixVente,
    stock_actuel: stock,
    seuil_alerte: seuil,
    image_url: imageUrl,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Réapprovisionner un produit existant
// ---------------------------------------------------------------------------
export async function reapprovisionner(produitId: string, quantite: number) {
  if (quantite <= 0) {
    return { success: false, error: 'Quantité invalide.' };
  }

  const supabase = await createClient();

  const { data: produit, error: fetchError } = await supabase
    .from('produits')
    .select('stock_actuel, prix_achat')
    .eq('id', produitId)
    .single();

  if (fetchError || !produit) {
    return { success: false, error: 'Produit introuvable.' };
  }

  const { error: updateError } = await supabase
    .from('produits')
    .update({ stock_actuel: produit.stock_actuel + quantite })
    .eq('id', produitId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Trace l'historique du réapprovisionnement (table prévue dès l'étape 1)
  await supabase.from('reapprovisionnements').insert({
    produit_id: produitId,
    quantite_ajoutee: quantite,
    prix_achat_unitaire: produit.prix_achat,
  });

  revalidatePath('/', 'layout');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Déclarer une perte (casse, consommation personnelle)
// ---------------------------------------------------------------------------
export async function declererPerte(produitId: string, quantite: number, motif: string) {
  if (quantite <= 0) {
    return { success: false, error: 'Quantité invalide.' };
  }

  const supabase = await createClient();

  const { data: produit, error: fetchError } = await supabase
    .from('produits')
    .select('stock_actuel')
    .eq('id', produitId)
    .single();

  if (fetchError || !produit) {
    return { success: false, error: 'Produit introuvable.' };
  }

  if (quantite > produit.stock_actuel) {
    return { success: false, error: 'Quantité supérieure au stock disponible.' };
  }

  const { error: updateError } = await supabase
    .from('produits')
    .update({ stock_actuel: produit.stock_actuel - quantite })
    .eq('id', produitId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from('sorties_exceptionnelles').insert({
    produit_id: produitId,
    quantite,
    motif,
  });

  revalidatePath('/', 'layout');
  return { success: true };
}


//archive des produits non use

export async function archiverProduit(produitId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('produits')
    .update({ actif: false })
    .eq('id', produitId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

// ---------------------------------------------------------------------------
// modifier un produit existant
//---------------------------------------------------------------------------

// app/actions/produits.ts — ajoute cette fonction à la fin du fichier

export async function modifierProduit(produitId: string, formData: FormData) {
  const supabase = await createClient();

  const nom = String(formData.get('nom') ?? '').trim();
  const prixAchat = Number(formData.get('prixAchat'));
  const prixVente = Number(formData.get('prixVente'));
  const seuil = Number(formData.get('seuil')) || 5;
  const image = formData.get('image') as File | null;

  if (!nom || !prixAchat || !prixVente) {
    return { success: false, error: 'Nom, prix d\'achat et prix de vente sont requis.' };
  }

  const updateData: Record<string, unknown> = {
    nom,
    prix_achat: prixAchat,
    prix_vente: prixVente,
    seuil_alerte: seuil,
  };

  // Remplace la photo uniquement si une nouvelle a été fournie
  if (image && image.size > 0) {
    const extension = image.name.split('.').pop();
    const chemin = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('produits-images')
      .upload(chemin, image, { contentType: image.type });

    if (uploadError) {
      return { success: false, error: `Échec de l'upload de l'image : ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from('produits-images')
      .getPublicUrl(chemin);

    updateData.image_url = publicUrlData.publicUrl;
  }

  const { error } = await supabase
    .from('produits')
    .update(updateData)
    .eq('id', produitId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

///---------------------------------------------------------------------------
// Dé-archiver un produit existant
//---------------------------------------------------------------------------

export async function desarchiverProduit(produitId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('produits')
    .update({ actif: true })
    .eq('id', produitId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}