// app/(app)/layout.tsx
import Image from 'next/image';
import { createClient } from '@/app/lib/supabase/server';
import { UserMenu } from '@/components/ui/UserMenu';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { TabBar } from '@/components/ui/TabBar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: produits } = await supabase
  .from('produits')
  .select('id, nom, stock_actuel, seuil_alerte')
  .eq('actif', true);

  const alertes = (produits ?? [])
    .filter((p) => p.stock_actuel <= p.seuil_alerte)
    .map((p) => ({ id: p.id, nom: p.nom, stock: p.stock_actuel, seuil: p.seuil_alerte }))
    .sort((a, b) => a.stock - b.stock);

  return (
    <div className="min-h-screen relative pb-24 bg-[#f5f5f7]">
      {/* Header plus proche du haut */}
      <header className="max-w-[420px] mx-auto px-5 pt-4 pb-3 flex items-center justify-between">
        {/* Logo à gauche */}
        <Image 
          src="/logo.png" 
          alt="GarbaDrinks Manager" 
          width={100} 
          height={27} 
          priority 
        />
        
        {/* Actions à droite */}
        <div className="flex items-center gap-1">
          <NotificationBell alertes={alertes} />
          <UserMenu />
        </div>
      </header>

      {/* Ligne de séparation subtile */}
    <div className="max-w-[420px] mx-auto px-5">
        <div className="h-px bg-gray-200/60"></div>
      </div>

      {/* Contenu */}
      <main className="max-w-[420px] mx-auto px-5 pt-4">
        {children}
      </main>

      <TabBar />
    </div>
  );
}