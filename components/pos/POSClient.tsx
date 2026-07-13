// components/pos/POSClient.tsx
'use client';

import { useState, useTransition, useMemo } from 'react';
import Image from 'next/image';
import { confirmerVente } from '@/app/actions/ventes';

type Produit = {
  id: string;
  nom: string;
  prix_vente: number;
  stock_actuel: number;
  seuil_alerte: number;
  image_url: string | null;
};

function stockStatus(p: Produit): 'ok' | 'low' | 'out' {
  if (p.stock_actuel <= 0) return 'out';
  if (p.stock_actuel <= p.seuil_alerte) return 'low';
  return 'ok';
}

export function POSClient({ produits }: { produits: Produit[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [encaissePar, setEncaissePar] = useState<'moi' | 'garbashaw'>('moi');
  const [modePaiement, setModePaiement] = useState<'espece' | 'wave'>('espece');
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProduits = useMemo(() => {
    if (!searchQuery.trim()) return produits;

    const query = searchQuery.toLowerCase().trim();
    return produits.filter(
      (p) => 
        p.nom.toLowerCase().includes(query) || 
        p.prix_vente.toString().includes(query)
    );
  }, [produits, searchQuery]);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = Object.entries(cart).reduce((s, [id, q]) => {
    const p = produits.find((p) => p.id === id);
    return s + (p ? p.prix_vente * q : 0);
  }, 0);

  function changerQuantite(produitId: string, delta: number) {
    const produit = produits.find((p) => p.id === produitId);
    if (!produit) return;
    setCart((prev) => {
      const actuel = prev[produitId] ?? 0;
      const next = actuel + delta;
      if (next <= 0) {
        const { [produitId]: _, ...reste } = prev;
        return reste;
      }
      if (next > produit.stock_actuel) return prev;
      return { ...prev, [produitId]: next };
    });
  }

  function handleConfirmer() {
    setErreur(null);
    const articles = Object.entries(cart).map(([produitId, quantite]) => ({
      produitId,
      quantite,
    }));

    startTransition(async () => {
      const result = await confirmerVente(articles, encaissePar, modePaiement);
      if (!result.success) {
        setErreur(result.error ?? 'Erreur inconnue.');
        return;
      }
      setCart({});
      setModalOpen(false);
      setEncaissePar('moi');
      setModePaiement('espece');
    });
  }

  return (
    <>
      {/* En-tête avec recherche */}
      <div className="px-5 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Catalogue</h2>
          {cartCount > 0 && (
            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
              {cartCount} article{cartCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <svg 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher une boisson..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-all"
            style={{ fontSize: '16px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {searchQuery && (
          <p className="text-xs text-gray-400">
            {filteredProduits.length} résultat{filteredProduits.length > 1 ? 's' : ''} pour « {searchQuery} »
          </p>
        )}
      </div>

      {/* Grille de produits avec padding bottom pour la barre de validation */}
      <div className={`grid grid-cols-2 gap-3 px-5 ${cartCount > 0 ? 'pb-24' : 'pb-4'}`}>
        {filteredProduits.length === 0 ? (
          <div className="col-span-2 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">Aucune boisson trouvée</p>
          </div>
        ) : (
          filteredProduits.map((p) => {
            const status = stockStatus(p);
            const qty = cart[p.id] ?? 0;
            const disabled = status === 'out';

            return (
              <div
                key={p.id}
                className={`relative bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
                  disabled 
                    ? 'border-gray-100 opacity-40' 
                    : qty > 0 
                      ? 'border-red-200 ring-2 ring-red-500/10 shadow-md' 
                      : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Container image parfaitement carré */}
                <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                  {p.image_url ? (
                    <Image 
                      src={p.image_url} 
                      alt={p.nom} 
                      fill
                      className="object-contain p-4" 
                      sizes="(max-width: 420px) 50vw, 200px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl">🥤</span>
                    </div>
                  )}
                  
                  {/* Badge stock */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md shadow-sm ${
                        status === 'ok'
                          ? 'bg-green-500/90 text-white'
                          : status === 'low'
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-red-500/90 text-white'
                      }`}
                    >
                      {p.stock_actuel === 0 ? 'Épuisé' : `${p.stock_actuel}`}
                    </span>
                  </div>

                  {/* Badge quantité dans le panier */}
                  {qty > 0 && (
                    <div className="absolute bottom-2.5 left-2.5 bg-gray-900/90 backdrop-blur-md rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                      ✕{qty}
                    </div>
                  )}
                </div>

                {/* Infos produit */}
                <div className="p-3.5">
                  <h3 className="text-[13px] font-semibold text-gray-900 leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                    {p.nom}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-gray-900">
                        {p.prix_vente.toLocaleString('fr-FR')}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium ml-0.5">F</span>
                    </div>
                    
                    <div className="flex items-center gap-0.5 bg-gray-50 rounded-full p-0.5">
                      <button
                        onClick={() => changerQuantite(p.id, -1)}
                        disabled={qty === 0}
                        className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 active:bg-gray-100 transition-all"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-600">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                      <span className={`text-xs font-bold min-w-[20px] text-center ${
                        qty > 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {qty || '0'}
                      </span>
                      <button
                        onClick={() => changerQuantite(p.id, 1)}
                        disabled={disabled || qty >= p.stock_actuel}
                        className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center disabled:opacity-30 hover:bg-red-600 active:bg-red-700 transition-all shadow-sm shadow-red-500/20"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-white">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Barre de validation flottante - positionnée plus haut pour ne pas masquer les boutons */}
      {cartCount > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[388px] bg-gray-900 rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-gray-900/30 z-10 animate-slide-up border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
            </div>
            <div className="text-white">
              <div className="text-[11px] text-gray-400 font-medium">
                {cartCount} article{cartCount > 1 ? 's' : ''}
              </div>
              <div className="font-mono font-bold text-lg">
                {cartTotal.toLocaleString('fr-FR')} <span className="text-sm font-normal text-gray-400">FCFA</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-xl px-5 py-3 font-bold text-sm transition-all shadow-lg shadow-red-500/25"
          >
            Valider
          </button>
        </div>
      )}

      {/* Modal de confirmation */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-20 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-white rounded-t-3xl w-full max-w-[420px] mx-auto p-5 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Confirmer la commande</h2>
                <p className="text-sm text-gray-500">
                  {cartTotal.toLocaleString('fr-FR')} FCFA · {cartCount} article{cartCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Résumé du panier */}
            <div className="bg-gray-50 rounded-2xl p-3 mb-5 max-h-40 overflow-y-auto">
              {Object.entries(cart).map(([id, qty]) => {
                const produit = produits.find((p) => p.id === id);
                if (!produit) return null;
                return (
                  <div key={id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="font-medium text-gray-700 flex-1">
                      {produit.nom}
                      <span className="text-gray-400 ml-1">✕{qty}</span>
                    </span>
                    <span className="font-mono font-bold text-gray-900">
                      {(produit.prix_vente * qty).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                );
              })}
            </div>

            {erreur && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5">
                <p className="text-sm text-red-600 font-medium flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {erreur}
                </p>
              </div>
            )}

            <SwitchRow
              label="Qui encaisse ?"
              leftLabel="Moi"
              rightLabel="Garbashaw"
              value={encaissePar === 'garbashaw'}
              onChange={(on) => setEncaissePar(on ? 'garbashaw' : 'moi')}
            />
            
            <SwitchRow
              label="Mode de règlement"
              leftLabel="Espèce"
              rightLabel="Wave"
              value={modePaiement === 'wave'}
              onChange={(on) => setModePaiement(on ? 'wave' : 'espece')}
            />

            <div className="space-y-2 mt-2">
              <button
                onClick={handleConfirmer}
                disabled={isPending}
                className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-2xl py-4 font-bold text-[15px] disabled:opacity-60 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Confirmer la vente
                  </>
                )}
              </button>
              
              <button
                onClick={() => setModalOpen(false)}
                className="w-full text-gray-500 font-semibold text-sm py-3 hover:text-gray-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

function SwitchRow({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="mb-5">
      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
        {label}
      </div>
      <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
        <button
          onClick={() => onChange(false)}
          className={`text-sm font-semibold transition-colors ${
            !value ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {leftLabel}
        </button>
        
        <button
          onClick={() => onChange(!value)}
          className={`relative w-[52px] h-8 rounded-full transition-all duration-200 ${
            value ? 'bg-red-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ${
              value ? 'left-[24px]' : 'left-1'
            }`}
          />
        </button>
        
        <button
          onClick={() => onChange(true)}
          className={`text-sm font-semibold transition-colors ${
            value ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {rightLabel}
        </button>
      </div>
    </div>
  );
}