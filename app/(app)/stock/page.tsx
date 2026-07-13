// app/(app)/stock/page.tsx
import { getProduitsPourStock } from '@/app/lib/supabase/queries';
import { StockClient } from '@/components/stock/StockClient';

export const revalidate = 15;

export default async function StockPage() {
  const { data: produitsActifs, error: erreurActifs } = await getProduitsPourStock(true);
  const { data: produitsArchives, error: erreurArchives } = await getProduitsPourStock(false);

  if (erreurActifs || erreurArchives) {
    return (
      <p className="px-5 text-sm text-[#ff1111]">
        Erreur : {erreurActifs?.message ?? erreurArchives?.message}
      </p>
    );
  }

  return <StockClient produits={produitsActifs ?? []} produitsArchives={produitsArchives ?? []} />;
}