// app/api/ventes/confirm/route.ts
import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

interface LineItem {
  productId: string;
  quantity: number;
  price: number;
}

interface VenteRequestBody {
  items: LineItem[];
  total: number;
  encaissePar?: string;
  modePaiement?: string;
  idempotencyKey?: string;
}

interface Product {
  id: string;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  nom: string;
}

/**
 * POST /api/ventes/confirm
 * Endpoint pour enregistrer les ventes (compatible avec offline sync)
 * Accepte une clé d'idempotence côté client pour éviter les doublons
 */
export async function POST(req: NextRequest) {
  try {
    const body: VenteRequestBody = await req.json();
    const {
      items,
      total,
      encaissePar = 'moi',
      modePaiement = 'espece',
      idempotencyKey, // UUID de l'appareil pour éviter les doublons
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Le panier est vide' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Vérifier si cette vente a déjà été synchronisée (via idempotencyKey)
    if (idempotencyKey) {
      const { data: existingVente } = await supabase
        .from('ventes')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existingVente) {
        // Vente déjà enregistrée avec ce clé, retourner succès pour éviter la duplication
        console.log('[API] Vente déjà enregistrée:', idempotencyKey);
        return NextResponse.json({ success: true, cached: true, id: existingVente.id });
      }
    }

    // Récupérer les produits et leurs prix actuels
    const productIds = items.map((item) => item.productId);
    const { data: products, error: productsError } = await supabase
      .from('produits')
      .select('id, prix_achat, prix_vente, stock_actuel, nom')
      .in('id', productIds);

    if (productsError || !products) {
      return NextResponse.json(
        { error: 'Impossible de vérifier les produits' },
        { status: 500 }
      );
    }

    // Vérifier le stock
    for (const item of items) {
      const product = (products as Product[]).find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Produit ${item.productId} n'existe pas` },
          { status: 400 }
        );
      }
      if (item.quantity > product.stock_actuel) {
        return NextResponse.json(
          { error: `Stock insuffisant pour ${product.nom}` },
          { status: 400 }
        );
      }
    }

    // Créer l'en-tête de vente
    const { data: vente, error: venteError } = await supabase
      .from('ventes')
      .insert({
        montant_total: total,
        encaisse_par: encaissePar,
        mode_paiement: modePaiement,
        idempotency_key: idempotencyKey,
      })
      .select('id')
      .single();

    if (venteError || !vente) {
      console.error('[API] Erreur lors de la création de la vente:', venteError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la vente' },
        { status: 500 }
      );
    }

    // Créer les lignes de vente
    const lignes = items.map((item) => {
      const product = (products as Product[]).find((p) => p.id === item.productId)!;
      return {
        vente_id: vente.id,
        produit_id: item.productId,
        quantite: item.quantity,
        prix_unitaire_achat: product.prix_achat,
        prix_unitaire_vente: product.prix_vente,
      };
    });

    const { error: lignesError } = await supabase
      .from('ligne_ventes')
      .insert(lignes);

    if (lignesError) {
      console.error('[API] Erreur lors de l\'insertion des lignes:', lignesError);
      // Suppression de la vente si les lignes échouent
      await supabase.from('ventes').delete().eq('id', vente.id);
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement des articles' },
        { status: 500 }
      );
    }

    // Revalider le cache
    revalidatePath('/', 'layout');

    console.log('[API] Vente enregistrée:', vente.id);
    return NextResponse.json({ 
      success: true, 
      id: vente.id,
      cached: false 
    });
  } catch (error) {
    console.error('[API] Erreur lors de la confirmation de vente:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
