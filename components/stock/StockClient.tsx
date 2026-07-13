/* eslint-disable react/no-unescaped-entities */
// components/stock/StockClient.tsx
'use client';

import { useState, useTransition, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  ajouterProduit,
  reapprovisionner,
  declererPerte,
  archiverProduit,
  modifierProduit,
  desarchiverProduit,
} from '@/app/actions/produits';

type Produit = {
  id: string;
  nom: string;
  prix_achat: number;
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

export function StockClient({
  produits,
  produitsArchives,
}: {
  produits: Produit[];
  produitsArchives: Produit[];
}) {
  const [modalNouveauOuvert, setModalNouveauOuvert] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: 'reappro' | 'perte'; produit: Produit } | null>(null);
  const [modalEditionProduit, setModalEditionProduit] = useState<Produit | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [archivesOuvert, setArchivesOuvert] = useState(false);

  const [rupturesCount, alertesCount] = useMemo(() => {
    let ruptures = 0;
    let alertes = 0;

    for (const produit of produits) {
      if (produit.stock_actuel <= 0) ruptures += 1;
      else if (produit.stock_actuel <= produit.seuil_alerte) alertes += 1;
    }

    return [ruptures, alertes] as const;
  }, [produits]);

  const filteredProduits = useMemo(() => {
    let filtered = [...produits];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.nom.toLowerCase().includes(query) ||
          p.prix_vente.toString().includes(query) ||
          p.prix_achat.toString().includes(query)
      );
    }

    if (filterStock === 'low') {
      filtered = filtered.filter((p) => p.stock_actuel > 0 && p.stock_actuel <= p.seuil_alerte);
    } else if (filterStock === 'out') {
      filtered = filtered.filter((p) => p.stock_actuel <= 0);
    }

    filtered.sort((a, b) => {
      const statusOrder = { out: 0, low: 1, ok: 2 };
      return statusOrder[stockStatus(a)] - statusOrder[stockStatus(b)];
    });

    return filtered;
  }, [produits, searchQuery, filterStock]);

  function handleArchiver(produit: Produit) {
    const confirme = window.confirm(
      `Archiver "${produit.nom}" ? Il disparaîtra du catalogue et de la liste stock, mais reste conservé dans l'historique des ventes passées.`
    );
    if (!confirme) return;

    startTransition(async () => {
      const result = await archiverProduit(produit.id);
      if (!result.success) {
        setErreur(result.error ?? 'Erreur lors de l\'archivage.');
      }
    });
  }

  function handleDesarchiver(produit: Produit) {
    startTransition(async () => {
      const result = await desarchiverProduit(produit.id);
      if (!result.success) {
        setErreur(result.error ?? 'Erreur lors de la réactivation.');
      }
    });
  }

  return (
    <>
      <div className="px-5 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Gestion du stock</h2>
          <div className="flex items-center gap-2">
            {alertesCount > 0 && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {alertesCount} alerte{alertesCount > 1 ? 's' : ''}
              </span>
            )}
            {rupturesCount > 0 && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                {rupturesCount} rupture{rupturesCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher un produit..."
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStock('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterStock === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tous ({produits.length})
          </button>
          <button
            onClick={() => setFilterStock('low')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterStock === 'low' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            }`}
          >
            Alertes ({alertesCount})
          </button>
          <button
            onClick={() => setFilterStock('out')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterStock === 'out' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            Ruptures ({rupturesCount})
          </button>
        </div>
      </div>

      <div className="px-5 pb-4 space-y-2">
        {filteredProduits.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">Aucun produit trouvé</p>
          </div>
        ) : (
          filteredProduits.map((p) => {
            const status = stockStatus(p);
            return (
              <div
                key={p.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
                  status === 'out'
                    ? 'border-red-200 bg-red-50/30'
                    : status === 'low'
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="p-3 flex gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100 relative">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.nom}
                        fill
                        className="object-contain p-2"
                        sizes="56px"
                      />
                    ) : (
                      <span className="text-2xl">🥤</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900 leading-tight">{p.nom}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-500">
                            Achat <span className="font-mono font-semibold text-gray-700">{p.prix_achat}F</span>
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-[11px] text-gray-500">
                            Vente <span className="font-mono font-semibold text-gray-700">{p.prix_vente}F</span>
                          </span>
                          <span className="text-[11px] text-green-600 font-semibold">+{p.prix_vente - p.prix_achat}F</span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        status === 'ok' ? 'bg-green-100 text-green-700' : status === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.stock_actuel === 0 ? 'Épuisé' : `${p.stock_actuel} en stock`}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 mb-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          status === 'ok' ? 'bg-green-500' : status === 'low' ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, (p.stock_actuel / Math.max(p.seuil_alerte * 2, p.stock_actuel, 1)) * 100)}%` }}
                      />
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => setModalEditionProduit(p)} className="text-[11px] font-semibold rounded-lg px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                        Modifier
                      </button>
                      <button onClick={() => setActionModal({ type: 'reappro', produit: p })} className="text-[11px] font-semibold rounded-lg px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-all">
                        + Réappro
                      </button>
                      <button onClick={() => setActionModal({ type: 'perte', produit: p })} className="text-[11px] font-semibold rounded-lg px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all">
                        Perte
                      </button>
                      <button onClick={() => handleArchiver(p)} className="text-[11px] font-semibold rounded-lg px-3 py-1.5 bg-white border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-500 transition-all">
                        Archiver
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===================================================================
          Produits archivés — section repliable, en bas de la liste active
      =================================================================== */}
      {produitsArchives.length > 0 && (
        <div className="px-5 pb-24">
          <button
            onClick={() => setArchivesOuvert((o) => !o)}
            className="w-full flex items-center justify-between text-xs font-bold text-gray-400 py-2.5 border-t border-gray-100"
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8v13H3V8" />
                <path d="M1 3h22v5H1z" />
                <path d="M10 12h4" />
              </svg>
              Produits archivés ({produitsArchives.length})
            </span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${archivesOuvert ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {archivesOuvert && (
            <div className="space-y-2 mt-2">
              {produitsArchives.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-gray-100 rounded-2xl p-3 flex gap-3 items-center opacity-70"
                >
                  <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100 relative">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.nom} fill className="object-contain p-1.5" sizes="44px" />
                    ) : (
                      <span className="text-lg">🥤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px] text-gray-900 leading-tight">{p.nom}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Vente <span className="font-mono font-semibold text-gray-700">{p.prix_vente}F</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDesarchiver(p)}
                    disabled={isPending}
                    className="text-[11px] font-semibold rounded-lg px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-all disabled:opacity-50 flex-shrink-0"
                  >
                    Réactiver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[388px] z-10">
        <button
          onClick={() => setModalNouveauOuvert(true)}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl py-4 font-bold text-sm transition-all shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau produit
        </button>
      </div>

      {modalNouveauOuvert && (
        <ModalNouveauProduit
          onClose={() => setModalNouveauOuvert(false)}
          isPending={isPending}
          erreur={erreur}
          onSubmit={(formData) => {
            setErreur(null);
            startTransition(async () => {
              const result = await ajouterProduit(formData);
              if (!result.success) {
                setErreur(result.error ?? 'Erreur inconnue.');
                return;
              }
              setModalNouveauOuvert(false);
            });
          }}
        />
      )}

      {actionModal && (
        <ModalStockAction
          type={actionModal.type}
          produit={actionModal.produit}
          isPending={isPending}
          erreur={erreur}
          onClose={() => { setActionModal(null); setErreur(null); }}
          onSubmit={(quantite, motif) => {
            setErreur(null);
            startTransition(async () => {
              const result = actionModal.type === 'reappro'
                ? await reapprovisionner(actionModal.produit.id, quantite)
                : await declererPerte(actionModal.produit.id, quantite, motif ?? '');
              if (!result.success) {
                setErreur(result.error ?? 'Erreur inconnue.');
                return;
              }
              setActionModal(null);
            });
          }}
        />
      )}

      {modalEditionProduit && (
        <ModalEditionProduit
          produit={modalEditionProduit}
          onClose={() => { setModalEditionProduit(null); setErreur(null); }}
          isPending={isPending}
          erreur={erreur}
          onSubmit={(formData) => {
            setErreur(null);
            startTransition(async () => {
              const result = await modifierProduit(modalEditionProduit.id, formData);
              if (!result.success) {
                setErreur(result.error ?? 'Erreur inconnue.');
                return;
              }
              setModalEditionProduit(null);
            });
          }}
        />
      )}
    </>
  );
}

// ===========================================================================
// Modal : nouveau produit
// ===========================================================================
function ModalNouveauProduit({
  onClose,
  onSubmit,
  isPending,
  erreur,
}: {
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  erreur: string | null;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-20" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-t-3xl w-full max-w-[420px] mx-auto p-5 pb-8 max-h-[88vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nouveau produit</h2>
            <p className="text-sm text-gray-500">Ajouter un article au catalogue</p>
          </div>
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

        <form action={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Photo (optionnel)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden relative hover:border-gray-300 transition-colors"
            >
              {previewUrl ? (
                <div className="w-full h-full relative">
                  <Image
                    src={previewUrl}
                    alt="Aperçu"
                    fill
                    className="object-contain p-4"
                    sizes="388px"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mx-auto mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="text-xs text-gray-400 font-medium">Toucher pour choisir une photo</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" name="image" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Nom du produit</label>
            <input name="nom" type="text" required placeholder="ex: Eau Awale 50cl" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all" style={{ fontSize: '16px' }} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Prix d'achat (F)</label>
              <input name="prixAchat" type="number" required placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all" style={{ fontSize: '16px' }} />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Prix de vente (F)</label>
              <input name="prixVente" type="number" required placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all" style={{ fontSize: '16px' }} />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Stock initial</label>
              <input name="stock" type="number" placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all" style={{ fontSize: '16px' }} />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Seuil d'alerte</label>
              <input name="seuil" type="number" placeholder="5" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all" style={{ fontSize: '16px' }} />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button type="submit" disabled={isPending} className="w-full bg-red-500 hover:bg-red-600 text-white rounded-2xl py-4 font-bold text-[15px] disabled:opacity-60 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2">
              {isPending ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Ajout en cours...</>
              ) : 'Ajouter le produit'}
            </button>
            <button type="button" onClick={onClose} className="w-full text-gray-500 font-semibold text-sm py-3 hover:text-gray-700 transition-colors">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================================================
// Modal : réapprovisionnement ou déclaration de perte
// ===========================================================================
function ModalStockAction({
  type,
  produit,
  onClose,
  onSubmit,
  isPending,
  erreur,
}: {
  type: 'reappro' | 'perte';
  produit: Produit;
  onClose: () => void;
  onSubmit: (quantite: number, motif?: string) => void;
  isPending: boolean;
  erreur: string | null;
}) {
  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState('Bouteille cassée / endommagée');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-20" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-t-3xl w-full max-w-[420px] mx-auto p-5 pb-8">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${type === 'reappro' ? 'bg-green-50' : 'bg-red-50'}`}>
            {type === 'reappro' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{type === 'reappro' ? 'Réapprovisionner' : 'Déclarer une perte'}</h2>
            <p className="text-sm text-gray-500">{produit.nom} · Stock actuel : <span className="font-semibold text-gray-700">{produit.stock_actuel}</span></p>
          </div>
        </div>

        {erreur && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5">
            <p className="text-sm text-red-600 font-medium flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {erreur}
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantité</label>
          <input type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all" style={{ fontSize: '16px' }} />
        </div>

        {type === 'perte' && (
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Motif</label>
            <select value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all" style={{ fontSize: '16px' }}>
              <option>Bouteille cassée / endommagée</option>
              <option>Consommation personnelle</option>
              <option>Produit périmé</option>
              <option>Erreur de livraison</option>
            </select>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button onClick={() => onSubmit(Number(quantite), motif)} disabled={isPending || !quantite} className={`w-full text-white rounded-2xl py-4 font-bold text-[15px] disabled:opacity-60 transition-all shadow-lg flex items-center justify-center gap-2 ${type === 'reappro' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/25' : 'bg-red-500 hover:bg-red-600 shadow-red-500/25'}`}>
            {isPending ? 'Confirmation...' : 'Confirmer'}
          </button>
          <button onClick={onClose} className="w-full text-gray-500 font-semibold text-sm py-3 hover:text-gray-700 transition-colors">Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Modal : édition d'un produit
// ===========================================================================
function ModalEditionProduit({
  produit,
  onClose,
  onSubmit,
  isPending,
  erreur,
}: {
  produit: Produit;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  erreur: string | null;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(produit.image_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-20" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-t-3xl w-full max-w-[420px] mx-auto p-5 pb-8 max-h-[88vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
            {produit.image_url ? (
              <Image src={produit.image_url} alt={produit.nom} fill className="object-contain p-2" sizes="48px" />
            ) : (
              <span className="text-xl">🥤</span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Modifier le produit</h2>
            <p className="text-sm text-gray-500">{produit.nom}</p>
          </div>
        </div>

        {erreur && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5">
            <p className="text-sm text-red-600 font-medium flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {erreur}
            </p>
          </div>
        )}

        <form action={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Photo</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden relative hover:border-gray-300 transition-colors"
            >
              {previewUrl ? (
                <div className="w-full h-full relative">
                  <Image src={previewUrl} alt="Aperçu" fill className="object-contain p-4" sizes="388px" />
                </div>
              ) : (
                <div className="text-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mx-auto mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="text-xs text-gray-400 font-medium">Toucher pour changer la photo</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" name="image" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Nom du produit</label>
            <input name="nom" type="text" required defaultValue={produit.nom} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all" style={{ fontSize: '16px' }} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Prix d'achat (F)</label>
              <input name="prixAchat" type="number" required defaultValue={produit.prix_achat} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all" style={{ fontSize: '16px' }} />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Prix de vente (F)</label>
              <input name="prixVente" type="number" required defaultValue={produit.prix_vente} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all" style={{ fontSize: '16px' }} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Seuil d'alerte</label>
            <input name="seuil" type="number" defaultValue={produit.seuil_alerte} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all" style={{ fontSize: '16px' }} />
          </div>

          <div className="bg-gray-50 rounded-2xl p-3">
            <p className="text-[11px] text-gray-500 leading-relaxed flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Stock actuel : <span className="font-semibold text-gray-700">{produit.stock_actuel}</span> — utilisez « + Réappro » ou « Perte » pour l'ajuster.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button type="submit" disabled={isPending} className="w-full bg-red-500 hover:bg-red-600 text-white rounded-2xl py-4 font-bold text-[15px] disabled:opacity-60 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2">
              {isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
            <button type="button" onClick={onClose} className="w-full text-gray-500 font-semibold text-sm py-3 hover:text-gray-700 transition-colors">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}