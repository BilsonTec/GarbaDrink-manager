// app/(app)/stock/page.tsx
import { createClient } from '@/app/lib/supabase/server';
import { StockClient } from '@/components/stock/StockClient';

export const revalidate = 15;

export default async function StockPage() {
  const supabase = await createClient();

  const { data: produitsActifs, error: erreurActifs } = await supabase
    .from('produits')
    .select('id, nom, prix_achat, prix_vente, stock_actuel, seuil_alerte, image_url')
    .eq('actif', true)
    .order('nom');

  const { data: produitsArchives, error: erreurArchives } = await supabase
    .from('produits')
    .select('id, nom, prix_achat, prix_vente, stock_actuel, seuil_alerte, image_url')
    .eq('actif', false)
    .order('nom');

  if (erreurActifs || erreurArchives) {
    return (
      <p className="px-5 text-sm text-[#ff1111]">
        Erreur : {erreurActifs?.message ?? erreurArchives?.message}
      </p>
    );
  }

  return <StockClient produits={produitsActifs ?? []} produitsArchives={produitsArchives ?? []} />;
}