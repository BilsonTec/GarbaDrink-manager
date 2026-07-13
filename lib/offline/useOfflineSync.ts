// lib/offline/useOfflineSync.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import {
  initDB,
  getPendingVentes,
  updateVenteStatus,
  deletePendingVente,
  updateSyncStatus,
  addPendingVente as addPendingVenteDB,
} from './indexeddb';

interface VenteItem {
  productId: string;
  quantity: number;
  price: number;
}

interface VenteData {
  clientId?: string;
  items: VenteItem[];
  total: number;
  encaissePar?: string;
  modePaiement?: string;
}

interface SyncOptions {
  onSyncStart?: () => void;
  onSyncProgress?: (current: number, total: number) => void;
  onSyncComplete?: (successful: number, failed: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour gérer la synchronisation offline des ventes
 */
export function useOfflineSync(options: SyncOptions = {}) {
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Fonction pour synchroniser les ventes en attente
   */
  const syncPendingVentes = useCallback(async () => {
    if (isSyncingRef.current) {
      console.log('[OfflineSync] Synchronisation déjà en cours');
      return;
    }

    if (!navigator.onLine) {
      console.log('[OfflineSync] Pas de réseau, synchronisation annulée');
      return;
    }

    try {
      await initDB();
      isSyncingRef.current = true;
      setIsSyncing(true);
      options.onSyncStart?.();

      const pendingVentes = await getPendingVentes();
      console.log(`[OfflineSync] ${pendingVentes.length} ventes à synchroniser`);

      if (pendingVentes.length === 0) {
        isSyncingRef.current = false;
        setIsSyncing(false);
        options.onSyncComplete?.(0, 0);
        return;
      }

      let successful = 0;
      let failed = 0;

      for (let i = 0; i < pendingVentes.length; i++) {
        const vente = pendingVentes[i];
        options.onSyncProgress?.(i + 1, pendingVentes.length);

        try {
          // Mettre à jour le statut à 'syncing'
          await updateVenteStatus(vente.id, 'syncing');

          // Appeler l'API Server Action pour enregistrer la vente
          // avec l'UUID client comme clé d'idempotence
          const response = await fetch('/api/ventes/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...vente,
              idempotencyKey: vente.id,
            }),
          });

          if (response.ok) {
            // Supprimer la vente du cache en cas de succès
            await deletePendingVente(vente.id);
            successful++;
            console.log(`[OfflineSync] Vente ${vente.id} synchronisée`);
          } else {
            const errorData = await response.json();
            throw new Error(
              errorData.error || `HTTP ${response.status}`
            );
          }
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          await updateVenteStatus(vente.id, 'error', errorMessage);
          console.error(`[OfflineSync] Erreur lors de la sync de ${vente.id}:`, error);

          // Ne pas retenter immédiatement si retryCount est trop élevé
          if (vente.retryCount > 3) {
            console.warn(
              `[OfflineSync] Trop de tentatives pour ${vente.id}, abandon`
            );
          }
        }
      }

      await updateSyncStatus(false);
      options.onSyncComplete?.(successful, failed);
      console.log(
        `[OfflineSync] Synchronisation terminée: ${successful} OK, ${failed} KO`
      );
    } catch (error) {
      console.error('[OfflineSync] Erreur lors de la synchronisation:', error);
      options.onError?.(error instanceof Error ? error : new Error('Erreur inconnue'));
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [options]);

  /**
   * Ajouter une vente avec fallback offline
   */
  const addVenteWithFallback = useCallback(
    async (venteData: VenteData) => {
      try {
        // D'abord, essayer l'appel réseau normal
        if (navigator.onLine) {
          try {
            const response = await fetch('/api/ventes/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(venteData),
            });

            if (response.ok) {
              return { success: true, cached: false };
            }
          } catch {
            console.log('[OfflineSync] Appel réseau échoué, utilisation du cache');
            // Continuer et mettre en cache en local
          }
        }

        // Si pas de réseau ou erreur réseau, stocker localement
        await initDB();
        const venteId = await addPendingVenteDB({
          clientId: venteData.clientId,
          items: venteData.items,
          total: venteData.total,
        });

        console.log('[OfflineSync] Vente stockée localement:', venteId);

        // Essayer la synchronisation si on est en ligne
        if (navigator.onLine) {
          // Délai court pour laisser à l'utilisateur le temps de voir le message
          syncTimeoutRef.current = setTimeout(() => {
            syncPendingVentes();
          }, 2000);
        }

        return { success: true, cached: true, venteId };
      } catch (error) {
        console.error('[OfflineSync] Erreur lors de l\'ajout de la vente:', error);
        throw error;
      }
    },
    [syncPendingVentes]
  );

  /**
   * Initialiser les écouteurs pour les changements de connectivité
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineSync] Connectivité rétablie, synchronisation...');
      syncPendingVentes();
    };

    const handleOffline = () => {
      console.log('[OfflineSync] Pas de connectivité');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialiser la base de données au montage
    initDB().catch((error) => {
      console.error('[OfflineSync] Erreur lors de l\'initialisation d\'IndexedDB:', error);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [syncPendingVentes]);

  return {
    syncPendingVentes,
    addVenteWithFallback,
    isSyncing,
  };
}
