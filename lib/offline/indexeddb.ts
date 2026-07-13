// lib/offline/indexeddb.ts
// Gestion d'IndexedDB pour la queue de ventes offline

const DB_NAME = 'GarbaDrinks';
const DB_VERSION = 1;
const VENTES_STORE = 'pendingVentes';
const SYNC_STATUS_STORE = 'syncStatus';

interface PendingVente {
  id: string; // UUID côté client pour l'idempotence
  clientId?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  error?: string;
  retryCount: number;
}

let db: IDBDatabase | null = null;

/**
 * Initialiser la base de données IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Erreur lors de l\'ouverture de la base de données');
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('[IndexedDB] Base de données initialisée');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Créer le store pour les ventes en attente
      if (!database.objectStoreNames.contains(VENTES_STORE)) {
        const venteStore = database.createObjectStore(VENTES_STORE, {
          keyPath: 'id',
        });
        venteStore.createIndex('status', 'status', { unique: false });
        venteStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Créer le store pour le statut de synchronisation
      if (!database.objectStoreNames.contains(SYNC_STATUS_STORE)) {
        database.createObjectStore(SYNC_STATUS_STORE, {
          keyPath: 'key',
        });
      }
    };
  });
}

/**
 * Ajouter une vente à la queue offline
 */
export async function addPendingVente(
  vente: Omit<PendingVente, 'id' | 'timestamp' | 'status' | 'retryCount'>
): Promise<string> {
  const database = db || (await initDB());
  const id = generateUUID();
  const pendingVente: PendingVente = {
    ...vente,
    id,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(VENTES_STORE, 'readwrite');
    const store = transaction.objectStore(VENTES_STORE);
    const request = store.add(pendingVente);

    request.onsuccess = () => {
      console.log('[IndexedDB] Vente stockée localement:', id);
      resolve(id);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Erreur lors de l\'ajout de la vente');
      reject(request.error);
    };
  });
}

/**
 * Récupérer toutes les ventes en attente de synchronisation
 */
export async function getPendingVentes(): Promise<PendingVente[]> {
  const database = db || (await initDB());

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(VENTES_STORE, 'readonly');
    const store = transaction.objectStore(VENTES_STORE);
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Erreur lors de la récupération des ventes');
      reject(request.error);
    };
  });
}

/**
 * Mettre à jour le statut d'une vente
 */
export async function updateVenteStatus(
  venteId: string,
  status: PendingVente['status'],
  error?: string
): Promise<void> {
  const database = db || (await initDB());

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(VENTES_STORE, 'readwrite');
    const store = transaction.objectStore(VENTES_STORE);
    const request = store.get(venteId);

    request.onsuccess = () => {
      const vente = request.result as PendingVente;
      if (vente) {
        vente.status = status;
        if (error) {
          vente.error = error;
          vente.retryCount += 1;
        }
        store.put(vente);
      }
      resolve();
    };

    request.onerror = () => {
      console.error('[IndexedDB] Erreur lors de la mise à jour du statut');
      reject(request.error);
    };
  });
}

/**
 * Supprimer une vente du cache (après synchronisation réussie)
 */
export async function deletePendingVente(venteId: string): Promise<void> {
  const database = db || (await initDB());

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(VENTES_STORE, 'readwrite');
    const store = transaction.objectStore(VENTES_STORE);
    const request = store.delete(venteId);

    request.onsuccess = () => {
      console.log('[IndexedDB] Vente supprimée du cache:', venteId);
      resolve();
    };

    request.onerror = () => {
      console.error('[IndexedDB] Erreur lors de la suppression');
      reject(request.error);
    };
  });
}

/**
 * Obtenir le dernier statut de synchronisation
 */
export async function getLastSyncStatus(): Promise<{
  lastSync: number;
  syncInProgress: boolean;
} | null> {
  const database = db || (await initDB());

  return new Promise((resolve) => {
    const transaction = database.transaction(SYNC_STATUS_STORE, 'readonly');
    const store = transaction.objectStore(SYNC_STATUS_STORE);
    const request = store.get('lastSync');

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Erreur lors de la récupération du statut');
      resolve(null);
    };
  });
}

/**
 * Mettre à jour le statut de synchronisation
 */
export async function updateSyncStatus(syncInProgress: boolean): Promise<void> {
  const database = db || (await initDB());

  return new Promise((resolve) => {
    const transaction = database.transaction(SYNC_STATUS_STORE, 'readwrite');
    const store = transaction.objectStore(SYNC_STATUS_STORE);
    store.put({
      key: 'lastSync',
      lastSync: Date.now(),
      syncInProgress,
    });
    resolve();
  });
}

/**
 * Générer un UUID côté client
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
