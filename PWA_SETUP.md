# Guide PWA - GarbaDrinks Manager

## ✅ Étapes complétées

### 1. **Installation et configuration**
- ✅ Installé `@ducanh2912/next-pwa`
- ✅ Configuré `next.config.ts` avec next-pwa
- ✅ Amélioré les meta tags iOS dans le layout racine
- ✅ Créé le manifeste PWA dynamique (`app/manifest.ts`)
- ✅ Icônes PWA présentes (192x192, 512x512, maskable)

### 2. **Service Worker**
- ✅ Créé `public/sw.js` avec stratégies de cache :
  - Cache-first pour assets statiques (JS, CSS, icons)
  - Network-first avec fallback cache pour données API
  - Stale-while-revalidate pour les pages

### 3. **Offline-first pour les ventes**
- ✅ Créé `lib/offline/indexeddb.ts` pour gérer IndexedDB
  - Stockage local des ventes en attente de sync
  - Gestion des UUID côté client (idempotence)
  - Statut de synchronisation
  
- ✅ Créé `lib/offline/useOfflineSync.ts` - Hook React pour :
  - Synchronisation automatique au retour du réseau
  - Gestion des tentatives de synchronisation
  - Notifications de progression

- ✅ Créé `app/api/ventes/confirm/route.ts` - API endpoint :
  - Accepte les ventes avec `idempotencyKey`
  - Évite les doublons même après reconnexion
  - Compatible avec le mode hors-ligne

- ✅ Modifié `components/pos/POSClient.tsx` :
  - Intégration du hook useOfflineSync
  - Affichage du statut connecté/hors-ligne
  - Indicateurs de synchronisation en temps réel

### 4. **Splash Screen à l'installation**
- ✅ Créé `components/ui/SplashScreen.tsx` avec logo animé
- ✅ Créé `components/PWAProvider.tsx` registrant le Service Worker
- ✅ Enregistrement automatiqu du Service Worker au chargement
- ✅ Intégré au layout racine

## 🔧 Configuration requise - AVANT de lancer l'app

### 1. Migration Supabase (IMPORTANT)

Exécutez cette migration SQL dans la console Supabase pour ajouter le support de l'idempotence :

```sql
-- Migration: Add idempotency_key to ventes table
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_ventes_idempotency_key ON ventes(idempotency_key);
```

**Fichier migration fourni :** `supabase/migrations/001_add_idempotency_key.sql`

### 2. Variable d'environnement (optionnel)

Si vous voulez désactiver PWA en développement, ajoutez à `.env.local` :
```
NEXT_PUBLIC_PWA_ENABLED=true
```

## 🚀 Lancer l'app

```bash
npm install  # Réinstallez les dépendances si vous aviez des anciens node_modules
npm run build  # Build production (génère le Service Worker)
npm start  # Lance le serveur
```

**Important :** Le Service Worker n'est pleinement actif qu'en production, pas en mode développement.

## 📱 Installation sur l'écran d'accueil

### iOS (Safari)
1. Ouvrir l'app dans Safari
2. **Actions** → **Ajouter à l'écran d'accueil**
3. Choisir un nom (ex: "GarbaDrinks")
4. Elle s'ajoute avec l'icône + le splash screen

### Android (Chrome/Edge)
1. Ouvrir l'app dans Chrome/Edge
2. Menu ⋮ → **Ajouter l'app à l'écran d'accueil** (ou notif auto qui apparaît)
3. L'app s'installe avec support complet hors-ligne

## 🔄 Fonctionnement hors-ligne

### Écran POS - Mode hors-ligne activé ✅
1. **Pas de réseau** → L'app continue de fonctionner
2. **Vendre** → Les ventes sont enregistrées **localement** dans IndexedDB
3. **Notification** → "🔄 Vente enregistrée localement. Synchronisation en attente de réseau..."
4. **Réseau revenu** → Synchronisation automatique, ventes envoyées au serveur
5. **Idempotence** → Même si la sync s'exécute deux fois, pas de doublon

### Autres écrans - Erreur gracieuse
- Historique, Stock, etc. affichent la dernière version en cache
- Notification "Pas de réseau - affichage du cache" au-dessus

## 📊 Architecture de cache

```
┌─────────────────────────────────────────┐
│           GarbaDrinks Manager           │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │ Service Worker
        │    (sw.js)
        └──────┬──────┘
      ┌────────┼────────┐
      ▼        ▼        ▼
   ┌──────┐ ┌──────┐ ┌────────────┐
   │Cache │ │Cache │ │  IndexedDB │
   │Assets │ │Data  │ │ (Ventes)  │
   └──────┘ └──────┘ └────────────┘
```

**Cache Assets** (long terme)
- Fichiers statiques : JS, CSS, fonts, icons

**Cache Data** (court terme)  
- API Supabase responses
- Auto-nettoyé en arrière-plan

**IndexedDB** (persistant)
- Ventes en attente de sync
- Statut de synchronisation

## 🐛 Débogage

### Chrome DevTools
1. **Application** → **Service Worker** : voir l'état du SW
2. **Application** → **Storage** → **IndexedDB** : voir les ventes en attente
3. **Application** → **Cache Storage** : voir les données en cache
4. **Console** : les logs `[PWA]`, `[offline]`, `[IndexedDB]` apparaissent

### Test offline
```bash
# Dans Chrome DevTools
1. Network tab → Offline
2. Essayer une vente → "🔄 Vente enregistrée localement..."
3. Network tab → Online (réactiver le réseau)
4. Auto-sync se déclenche
```

## 📝 Notes de développement

### Fichiers créés/modifiés
- **Créés** : 
  - `public/sw.js` - Service Worker
  - `lib/offline/indexeddb.ts` - Gestion IndexedDB
  - `lib/offline/useOfflineSync.ts` - Hook React
  - `app/api/ventes/confirm/route.ts` - API offline
  - `components/ui/SplashScreen.tsx` - Splash screen
  - `components/PWAProvider.tsx` - Provider PWA
  - `supabase/migrations/001_add_idempotency_key.sql` - Migration BD
  
- **Modifiés** :
  - `next.config.ts` - Ajout next-pwa
  - `app/layout.tsx` - Meta tags iOS + PWAProvider
  - `app/manifest.ts` - Améliorations PWA
  - `components/pos/POSClient.tsx` - Intégration offline

### Architecture décisions
1. **@ducanh2912/next-pwa** au lieu de Workbox manuel = configuration minimale
2. **IndexedDB** au lieu de localStorage = pas de limite de taille pour les ventes
3. **UUID côté client** pour idempotence = reconnexion sûre en cas de crash
4. **Storage API** pour assets = cache-first pour performance
5. **Network-first** pour données = toujours la donnée fraîche quand possible

## 📦 Dépendances ajoutées
- `@ducanh2912/next-pwa@^9.x.x` - PWA pour Next.js App Router

## ⚙️ Configuration clés dans next.config.ts
```typescript
const withPWAConfig = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,        // Cache pages au changement d'URL
  aggressiveFrontEndNavCaching: true, // Cache agressif
  reloadOnOnline: true,             // Recharger quand réseau revient
  disable: false,
});
```

## 🔐 Sécurité

### Certificat SSL/TLS (OBLIGATOIRE)
Les Service Workers ne fonctionnent QUE en HTTPS (sauf localhost).
- ✅ Production : activez HTTPS
- ✅ localhost : accepté en dev
- ❌ HTTP : le SW ne s'enregistrera pas

### Authentification
- L'app utilise déjà Supabase auth via le middleware
- Les ventes offline conservent le `encaissePar` depuis la dernière session

## 🎯 Prochaines étapes (optionnel)

1. **Web App Install Prompt** : Customiser le prompt d'installation
2. **Sync en arrière-plan** : Ajouter Background Sync API
3. **Notification lors du sync** : Toast notifications pour meilleure UX
4. **Download manager** : Pré-charger les données importantes
5. **Partage de fichiers** : Web Share API pour exporter les ventes

---

**Version PWA** : 1.0  
**Dernière mise à jour** : 2026-07-13  
**Statut** : ✅ Prêt pour production
