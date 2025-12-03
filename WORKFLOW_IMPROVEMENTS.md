# Améliorations du flux de demandes de réparation

## 🎯 Objectif
Améliorer et normaliser le cycle de vie complet des demandes de réparation avec des statuts cohérents, des transitions automatiques et une meilleure expérience utilisateur.

## ✅ Améliorations implémentées

### 1. Normalisation des statuts (français uniquement)

#### Statuts des demandes de réparation
- `créée` : Demande nouvellement créée par le client
- `en_attente` : Demande avec au moins une offre en attente de décision
- `assignée` : Une offre a été acceptée, réparateur assigné
- `en_cours` : Réparation démarrée par le réparateur
- `terminée` : Réparation finalisée
- `annulée` : Demande annulée par le client (avant acceptation d'offre)

#### Statuts des offres
- `proposée` : Offre soumise par un réparateur
- `acceptée` : Offre acceptée par le client
- `rejetée` : Offre rejetée par le client ou auto-rejetée
- `annulée` : Offre annulée par le réparateur

### 2. Transitions automatiques de statut

#### Transition créée → en_attente
**Déclencheur** : Automatique dès qu'un réparateur soumet la première offre
- Backend : `repairOfferController.createOffer()`
- Améliore la visibilité : le client sait qu'il a reçu des offres

#### Transition assignée → en_cours
**Déclencheur** : Bouton "Démarrer la réparation" (réparateur assigné uniquement)
- Endpoint : `POST /api/repairs/:requestId/start`
- Frontend : `RepairActions` component
- Permission : Seul le réparateur assigné peut démarrer

#### Transition en_cours → terminée
**Déclencheur** : Bouton "Finaliser la réparation" (client OU réparateur)
- Endpoint : `POST /api/repairs/:requestId/complete`
- Frontend : `RepairActions` component
- Permissions : Client propriétaire OU réparateur assigné

### 3. Auto-rejet des offres concurrentes

**Comportement** : Quand une offre est acceptée, toutes les autres offres `proposée` de la même demande sont automatiquement rejetées
- Backend : `repairOfferController.updateOfferStatus()`
- Notifications Socket.io : Les réparateurs concernés sont notifiés en temps réel
- Événement : `offer_update` avec raison "Une autre offre a été acceptée"

### 4. Composants UI créés

#### `RepairActions.jsx`
Affiche les boutons de transition appropriés selon :
- Le statut actuel de la demande
- Le rôle de l'utilisateur (client/réparateur)
- Les permissions (propriétaire, réparateur assigné)

**Boutons disponibles** :
- 🔧 Démarrer (statut `assignée`, réparateur assigné)
- ✅ Finaliser (statut `en_cours`, client OU réparateur)
- ❌ Annuler (statuts `créée`/`en_attente`, client propriétaire)

#### `StatusBadge.jsx`
Badge visuel avec code couleur et icône pour chaque statut
- Type `repair` : demandes de réparation
- Type `offer` : offres de réparation
- Styles CSS adaptés pour chaque statut

## 📁 Fichiers modifiés

### Backend
- ✅ `backend/sql/003_normalize_repair_statuses.sql` - Migration SQL
- ✅ `backend/scripts/apply_migration_003.js` - Script d'application
- ✅ `backend/middlewares/validators.js` - Validation statuts français
- ✅ `backend/models/repairModel.js` - Requêtes SQL normalisées
- ✅ `backend/controllers/repairController.js` - Transitions + endpoints
- ✅ `backend/controllers/repairOfferController.js` - Auto-transitions et auto-rejet
- ✅ `backend/routes/repairRoutes.js` - Routes `/start` et `/complete`

### Frontend
- ✅ `frontend/src/services/api.js` - Méthodes `startRepair()`, `completeRepair()`
- ✅ `frontend/src/pages/DemandesList.jsx` - Statuts français
- ✅ `frontend/src/pages/OffresList.jsx` - Statuts français
- ✅ `frontend/src/components/RepairActions.jsx` - Nouveau composant
- ✅ `frontend/src/components/StatusBadge.jsx` - Nouveau composant
- ✅ `frontend/src/styles/RepairActions.css` - Styles
- ✅ `frontend/src/styles/StatusBadge.css` - Styles

## 🚀 Déploiement

### 1. Appliquer la migration SQL
```bash
cd backend
node scripts/apply_migration_003.js
```

### 2. Redémarrer le backend
```bash
npm run dev
```

### 3. Redémarrer le frontend
```bash
cd frontend
npm run dev
```

## 🔄 Flux complet d'une demande

```
1. Créée (client crée la demande)
   ↓
2. En attente (première offre reçue - AUTO)
   ↓
3. Assignée (client accepte une offre - AUTO: autres offres rejetées)
   ↓
4. En cours (réparateur démarre - BOUTON)
   ↓
5. Terminée (client/réparateur finalise - BOUTON)
```

**Chemins alternatifs** :
- `Créée` → `Annulée` (client annule avant offres)
- `En attente` → `Annulée` (client annule avant acceptation)

## 🧪 Tests recommandés

### Scénario 1 : Flux complet
1. Client crée demande (statut `créée`)
2. Réparateur soumet offre (statut → `en_attente` AUTO)
3. Client accepte offre (statut → `assignée`, autres offres → `rejetée`)
4. Réparateur clique "Démarrer" (statut → `en_cours`)
5. Client/Réparateur clique "Finaliser" (statut → `terminée`)

### Scénario 2 : Annulation
1. Client crée demande
2. Client clique "Annuler" (statut → `annulée`)

### Scénario 3 : Multiple offres
1. Client crée demande
2. Réparateur A soumet offre
3. Réparateur B soumet offre
4. Client accepte offre A
   - Vérifier : Offre B auto-rejetée
   - Vérifier : Notification Socket.io pour réparateur B

## 📊 Avantages

✅ **Cohérence** : Tous les statuts en français, plus de confusion
✅ **Automatisation** : Transitions automatiques réduisent les erreurs
✅ **UX améliorée** : Boutons clairs, badges visuels, feedback immédiat
✅ **Protection** : Impossibilité d'annuler si offre acceptée
✅ **Transparence** : Notifications temps réel pour tous les acteurs
✅ **Maintenabilité** : Code structuré, composants réutilisables

## 🔜 Améliorations futures possibles

## 🎨 Améliorations UX/Praticité (Implémentées)

### 6. Filtres et tri dynamiques

#### DemandesList
- **Filtrage par statut** : créée, en_attente, assignée, en_cours, terminée
- **Compteur en temps réel** : Affiche le nombre d'items par statut
- **Tri multi-critères** :
   - Plus récente (défaut)
   - Plus ancienne
   - Titre (A-Z)

#### OffresList
- **Filtrage par statut** : proposée, acceptée, rejetée
- **Tri intelligent** :
   - Prix croissant 💰 (défaut - facilite comparaison)
   - Prix décroissant 💰
   - Durée la plus courte ⏱️
   - Plus récente 📅
- **Comparaison facilitée** : Tri automatique pour aider la décision

**Fichiers** :
- `frontend/src/styles/ListControls.css` - Styles filtres/tri
- Composants : `DemandesList.jsx`, `OffresList.jsx` modifiés

### 7. Système de notifications toast

**Fonctionnalités** :
- Types : success ✅, error ❌, warning ⚠️, info ℹ️
- Auto-dismiss après 4 secondes
- Cliquable pour fermer manuellement
- Animations d'entrée fluides
- Stack de notifications multiples

**Notifications implémentées** :
- ✅ Offre acceptée
- ❌ Erreurs d'API (acceptation, rejet, annulation)
- ℹ️ Offre rejetée
- ✅ Demande annulée

**Fichiers** :
- `frontend/src/context/ToastContext.jsx` - Contexte amélioré
- Hook : `useToast()` avec helpers (`success`, `error`, `warning`, `info`)

### 8. Indicateurs visuels améliorés

#### OfferBadge
Badge affichant le nombre d'offres reçues par demande :
- **Code couleur dynamique** :
   - Bleu : 1-2 offres (peu)
   - Orange : 3-4 offres (plusieurs)
   - Vert : 5+ offres (beaucoup)
   - Violet : Demande assignée/en_cours
   - Dégradé animé : Nouvelles offres non lues
- **Icône** : 💼 + nombre
- **Animation "pulse"** pour nouvelles offres

#### StatusBadge
Badges colorés avec émojis pour tous les statuts :
- 📝 Créée (bleu clair)
- ⏳ En attente (orange)
- 👤 Assignée (violet)
- 🔧 En cours (vert)
- ✅ Terminée (vert foncé)
- ❌ Annulée (rouge)
- 💼 Proposée (bleu)
- ✅ Acceptée (vert)
- ❌ Rejetée (rouge)

**Fichiers** :
- `frontend/src/components/OfferBadge.jsx` + styles
- `frontend/src/components/StatusBadge.jsx` + styles

### 9. RepairActions - Boutons contextuels

Composant intelligent affichant les actions selon :
- Statut actuel de la demande
- Rôle de l'utilisateur (client/réparateur)
- Permissions (propriétaire, réparateur assigné)

**Boutons disponibles** :
- 🔧 **Démarrer** : Si `assignée` ET réparateur assigné
- ✅ **Finaliser** : Si `en_cours` ET (client OU réparateur)
- ❌ **Annuler** : Si `créée`/`en_attente` ET client propriétaire

**Fichiers** :
- `frontend/src/components/RepairActions.jsx` + styles

## 📊 Bénéfices utilisateurs

### Pour les clients
✅ **Comparaison rapide** : Tri des offres par prix/durée facilite la décision
✅ **Visibilité** : Badge montrant le nombre d'offres reçues
✅ **Focus** : Filtrage pour ne voir que les demandes actives
✅ **Feedback** : Notifications immédiates sur toutes les actions
✅ **Contrôle** : Navigation simplifiée avec tri personnalisé

### Pour les réparateurs
✅ **Efficacité** : Filtres pour cibler les demandes pertinentes
✅ **Clarté** : Statuts visuels colorés évitent confusion
✅ **Réactivité** : Notifications temps réel des acceptations/rejets
✅ **Professionnalisme** : Interface soignée inspire confiance

## 🚀 Optimisations performances (2025-12-03)

### 10. Élimination du polling excessif

**Problème** : Pages se mettant à jour toutes les secondes causant surcharge serveur

**Solution** :
- Comparaison d'IDs avant mise à jour d'état (évite re-renders inutiles)
- useRef pour stocker valeurs précédentes (casse dépendances circulaires)
- Throttle 3s sur événement focus (réduit spam au retour sur page)
- Suppression des retry automatiques agressifs
- Actualisation uniquement sur changements réels (Socket.io events, actions user)

**Fichiers modifiés** :
- `frontend/src/pages/ExploreRepairs.jsx`
- `frontend/src/pages/DemandesList.jsx`
- `frontend/src/pages/OffresList.jsx`

**Impact mesuré** :
- Requêtes API : 10-20/seconde → 1-2 au chargement
- Logs backend : drastiquement réduits
- UX : "Dernière mise à jour" stable, pages réactives

### 11. Correction architecture WebSocket/CORS

**Problèmes** :
- ChatDemoSocket créait sa propre instance socket → erreur port 3000
- API pointait vers http://127.0.0.1:5000 → CORS bloqué
- Boucle infinie React (Maximum update depth exceeded)

**Solutions** :
- ChatDemoSocket utilise socket centralisé (`services/socket.js`)
- API_BASE_URL changé à `/api` (utilise proxy Vite)
- useRef au lieu d'état dans dépendances useCallback

**Fichiers modifiés** :
- `frontend/src/components/ChatDemoSocket.jsx`
- `frontend/src/services/api.js`
- `frontend/.env`

**Impact** :
- ✅ Plus d'erreurs CORS
- ✅ WebSocket fonctionne correctement
- ✅ Plus de boucle infinie React
- ✅ Connexion socket unique partagée

## 🔜 Améliorations futures possibles

- [ ] Système de notation après `terminée`
- [ ] Notifications push navigateur (en plus de Socket.io)
- [ ] Historique complet des transitions (audit trail)
- [ ] Pagination côté serveur (limit/offset)
- [ ] Recherche textuelle full-text sur titre/description
- [ ] Filtres géographiques (rayon, ville)
- [ ] Chat intégré entre client et réparateur
- [ ] Export PDF des demandes/offres
- [ ] Server-Sent Events (SSE) pour push pur sans fallback polling
- [ ] Variables environnement configurables (VITE_POLL_INTERVAL_MS)
