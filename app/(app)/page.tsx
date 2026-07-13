// app/(app)/page.tsx
import { createClient } from '@/app/lib/supabase/server';
import { POSClient } from '@/components/pos/POSClient';

export const revalidate = 15;

export default async function AccueilPage() {
  const supabase = await createClient();

  const { data: produits, error } = await supabase
    .from('produits')
    .select('id, nom, prix_vente, stock_actuel, seuil_alerte, image_url')
    .eq('actif', true)
    .order('nom');

  if (error) {
    return (
      <p className="px-5 text-sm text-[#ff1111]">
        Erreur de chargement du catalogue : {error.message}
      </p>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#f8f9fa] via-white to-[#f8f9fa]'>
      <POSClient produits={produits ?? []} />
    </div>
    
  );
  
  
}