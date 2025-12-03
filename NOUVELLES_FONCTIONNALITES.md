# 🌟 Nouvelles fonctionnalités - Velo Platform

## ✅ Système de notation et avis (2025-12-03)

### Backend

**Fichiers créés :**
- `backend/sql/005_create_reviews_table.sql` - Migration SQL pour tables `repair_reviews` et `push_subscriptions`
- `backend/models/reviewModel.js` - CRUD pour les avis
- `backend/controllers/reviewController.js` - API pour créer/consulter les avis
- `backend/routes/reviewRoutes.js` - Routes `/api/reviews`
- `backend/scripts/apply_migration_005.js` - Script d'application de migration

**API Endpoints :**
```
POST   /api/reviews                         - Créer un avis (client uniquement)
GET    /api/reviews/repair/:repairId        - Avis d'une réparation
GET    /api/reviews/repairer/:repairerId    - Tous les avis d'un réparateur (paginé)
GET    /api/reviews/repairer/:repairerId/stats - Statistiques de notation
```

**Fonctionnalités :**
- Note de 1 à 5 étoiles
- Commentaire optionnel (500 caractères max)
- Un seul avis par réparation (contrainte UNIQUE)
- Calcul automatique de la moyenne et distribution
- Pagination des avis

### Frontend

**Composants créés :**
- `frontend/src/components/ReviewModal.jsx` - Modal de notation interactive
- `frontend/src/components/RepairerReviews.jsx` - Affichage des avis avec stats
- `frontend/src/styles/ReviewModal.css`
- `frontend/src/styles/RepairerReviews.css`

**Fonctionnalités UX :**
- ⭐ Sélection de note avec hover interactif
- 📝 Commentaire optionnel avec compteur de caractères
- 📊 Affichage moyenne + distribution des notes
- 📄 Pagination "Voir plus"
- 🎨 Design élégant et responsive

**Intégration :**
- Service API : `reviewService` dans `services/api.js`
- À intégrer dans les pages après réparation terminée

---

## 🔔 Notifications Push Web (2025-12-03)

### Backend

**Fichiers créés :**
- `backend/models/pushSubscriptionModel.js` - Gestion des abonnements
- `backend/services/pushNotificationService.js` - Service web-push
- `backend/controllers/pushSubscriptionController.js` - API abonnements
- `backend/routes/pushSubscriptionRoutes.js` - Routes `/api/push`

**API Endpoints :**
```
GET    /api/push/vapid-public-key  - Clé publique VAPID
POST   /api/push/subscribe         - S'abonner (authentifié)
POST   /api/push/unsubscribe       - Se désabonner (authentifié)
```

**Service de notification :**
- `sendNotificationToUser(userId, payload)` - Envoyer notification
- Templates prédéfinis : offre acceptée/refusée, nouveau message, etc.
- Gestion automatique des abonnements expirés (410 Gone)

**Dépendance installée :**
```bash
npm install web-push
```

### Frontend

**Fichiers créés :**
- `frontend/public/service-worker.js` - Service Worker avec gestion notifications
- `frontend/src/services/pushNotification.js` - API client notifications
- `frontend/src/components/PushNotificationSettings.jsx` - UI activation/désactivation
- `frontend/src/styles/PushNotificationSettings.css`

**Fonctionnalités :**
- 🔔 Demande de permission navigateur
- 📱 Enregistrement Service Worker automatique
- 🔐 Abonnement VAPID sécurisé
- 🎯 Routing intelligent au clic (redirige vers page concernée)
- ⚡ Notifications même fenêtre fermée
- 🎨 Interface élégante avec indicateurs visuels

**Types de notifications :**
- Offre acceptée/refusée
- Nouvelle offre reçue
- Réparation démarrée/terminée
- Nouveau message
- Rappel de noter après réparation

---

## 📋 Instructions de déploiement

### 1. Appliquer la migration

**Option A : Via script Node.js (recommandé)**
```bash
cd backend
node scripts/apply_migration_005.js
```

**Option B : Via psql direct**
```bash
cd backend
psql -h localhost -U your_user -d velo_platform -f sql/005_create_reviews_table.sql
```

### 2. Générer les clés VAPID (une seule fois)

```bash
cd backend
npx web-push generate-vapid-keys
```

Ajouter dans `backend/.env` :
```env
VAPID_PUBLIC_KEY=votre_clé_publique
VAPID_PRIVATE_KEY=votre_clé_privée
VAPID_SUBJECT=mailto:contact@votre-domaine.com
```

### 3. Redémarrer le backend

```bash
cd backend
npm run dev
```

### 4. Intégration frontend

**A. Ajouter ReviewModal après réparation terminée**

Dans `DemandesList.jsx` ou page concernée :
```jsx
import ReviewModal from '../components/ReviewModal';

// État
const [showReviewModal, setShowReviewModal] = useState(false);
const [repairToReview, setRepairToReview] = useState(null);

// Handler pour ouvrir modal
const handleReview = (repair) => {
  setRepairToReview(repair);
  setShowReviewModal(true);
};

// Callback après soumission
const handleReviewSubmitted = (review) => {
  toast.success('✅ Merci pour votre avis !');
  // Recharger la liste si nécessaire
};

// Render
{showReviewModal && repairToReview && (
  <ReviewModal
    repair={repairToReview}
    onSubmit={handleReviewSubmitted}
    onClose={() => setShowReviewModal(false)}
  />
)}
```

**B. Afficher reviews sur profil réparateur**

```jsx
import RepairerReviews from '../components/RepairerReviews';

<RepairerReviews repairerId={repairer.id} />
```

**C. Ajouter notifications push dans profil**

```jsx
import PushNotificationSettings from '../components/PushNotificationSettings';

<PushNotificationSettings />
```

---

## 🧪 Tests

### Tester les avis

1. Terminer une réparation (statut `terminée`)
2. Ouvrir la modal de notation
3. Sélectionner 1-5 étoiles
4. Ajouter un commentaire (optionnel)
5. Soumettre
6. Vérifier l'affichage sur le profil réparateur

### Tester les notifications push

1. Activer les notifications dans les paramètres
2. Accepter la permission navigateur
3. Fermer l'onglet/navigateur
4. Déclencher un événement (accepter une offre, nouveau message)
5. Recevoir la notification système
6. Cliquer → redirection vers page concernée

---

## 📊 Métriques attendues

**Système de notation :**
- Confiance accrue des clients (notes visibles)
- Motivation des réparateurs (réputation)
- Feedback pour amélioration continue

**Notifications push :**
- Réactivité augmentée (notifications instantanées)
- Engagement accru (retour sur plateforme)
- Satisfaction utilisateur (alertes importantes)

---

## 🔧 Maintenance

**Variables d'environnement requises (production) :**
```env
# Backend .env
VAPID_PUBLIC_KEY=votre_clé_publique
VAPID_PRIVATE_KEY=votre_clé_privée  
VAPID_SUBJECT=mailto:admin@velo-platform.com
```

**Nettoyage automatique :**
- Les abonnements push expirés sont supprimés automatiquement (code 410)
- Les avis sont liés par clés étrangères (CASCADE on DELETE)

**Monitoring recommandé :**
- Nombre d'avis créés par jour
- Taux d'abonnement aux notifications
- Taux de clics sur notifications
- Notes moyennes par réparateur

---

✨ **Fonctionnalités prêtes à l'emploi !** Il reste à intégrer les composants dans les pages existantes et envoyer les notifications lors des événements métier.
