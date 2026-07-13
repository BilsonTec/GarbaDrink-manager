import { createClient } from './server';

type ProduitBase = {
  id: string;
  nom: string;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  seuil_alerte: number;
  image_url: string | null;
};

type AlerteStock = {
  id: string;
  nom: string;
  stock: number;
  seuil: number;
};

function normaliserProduits(data: unknown): ProduitBase[] {
  return (((data ?? []) as unknown) as Array<Record<string, unknown>>).map((produit) => ({
    id: String(produit.id ?? ''),
    nom: String(produit.nom ?? ''),
    prix_achat: Number(produit.prix_achat ?? 0),
    prix_vente: Number(produit.prix_vente ?? 0),
    stock_actuel: Number(produit.stock_actuel ?? 0),
    seuil_alerte: Number(produit.seuil_alerte ?? 0),
    image_url: produit.image_url ? String(produit.image_url) : null,
  }));
}

export async function getProduitsPourAccueil() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('produits')
    .select('id, nom, prix_vente, stock_actuel, seuil_alerte, image_url')
    .eq('actif', true)
    .order('nom');

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: normaliserProduits(data), error: null };
}

export async function getProduitsPourStock(actif: boolean) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('produits')
    .select('id, nom, prix_achat, prix_vente, stock_actuel, seuil_alerte, image_url')
    .eq('actif', actif)
    .order('nom');

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: normaliserProduits(data), error: null };
}

export async function getAlertesStock() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('produits')
    .select('id, nom, stock_actuel, seuil_alerte')
    .eq('actif', true)
    .order('stock_actuel', { ascending: true });

  if (error) {
    return { data: [] as AlerteStock[], error: new Error(error.message) };
  }

  const alertes = (((data ?? []) as unknown) as Array<Record<string, unknown>>)
    .filter((produit) => Number(produit.stock_actuel ?? 0) <= Number(produit.seuil_alerte ?? 0))
    .map((produit) => ({
      id: String(produit.id ?? ''),
      nom: String(produit.nom ?? ''),
      stock: Number(produit.stock_actuel ?? 0),
      seuil: Number(produit.seuil_alerte ?? 0),
    }));

  return { data: alertes, error: null };
}

export async function getVentesHistorique() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ventes')
    .select(
      'id, montant_total, encaisse_par, mode_paiement, statut_recupere, annulee, cree_le, ligne_ventes(quantite, produits(nom))'
    )
    .order('cree_le', { ascending: false });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: (data ?? []) as Record<string, unknown>[], error: null };
}

export async function getVentesLePoint() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ventes')
    .select(
      'id, montant_total, encaisse_par, mode_paiement, statut_recupere, ligne_ventes(quantite, prix_unitaire_achat)'
    )
    .eq('annulee', false);

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: (data ?? []) as Record<string, unknown>[], error: null };
}
