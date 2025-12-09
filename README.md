## Refactor page Réparateurs (déc. 2025)

### Problèmes corrigés
- Boucle infinie de rendu (useEffect/autocomplétion)
- Liste des réparateurs et carte vides malgré la réponse API
- Filtres trop restrictifs (nearbyOnly, onlyAvailable)
- Erreur d’import du composant RepairerCard

### Solutions apportées
- Passage des props stables via useMemo pour éviter les boucles de rendu
- Correction du mapping de la réponse API (`setRepairers(res.data.repairers || [])`)
- Suppression du filtre `nearbyOnly` dans le hook `useRepairers` (affichage garanti)
- Ajout de l’export par défaut dans `RepairerCard.jsx` pour compatibilité ESM
- Nettoyage des logs de debug

### Architecture finale
- Composant principal : `Repairers.jsx` (chargement, filtres, rendu liste + carte)
- Composants extraits : `RepairerCard`, `Drawer`, `FiltersPanel`, `RepairersMap`
- Hooks dédiés : `useRepairers`, `useAutocomplete`
- Chargement des réparateurs via API (`repairerService.getAllRepairers()`)
- Filtres désactivés par défaut, logique métier séparée

### Bonnes pratiques respectées
- Séparation logique métier / affichage
- Props stables pour les hooks
- Gestion d’erreur UI et API
- Documentation et journalisation dans le README.md central

### Exemple d’utilisation

```jsx
import Repairers from './pages/Repairers';
// ...
<Repairers />
```

La page affiche la liste complète des réparateurs et la carte, sans filtre restrictif par défaut.

---
# Règles Copilot pour velo-platform

## Documentation IA
- Toute documentation IA doit être intégrée dans le README.md principal ou celui du dossier concerné.
- Interdiction de créer/enrichir d’autres fichiers .md.
- Communication et documentation toujours en français.

## Style de code JavaScript/Node.js
- camelCase pour variables/fonctions, PascalCase pour composants/classes.
- Backend : CommonJS (`require`/`module.exports`), controllers/routes en `async function`.
- Frontend : ESM (`import`/`export`), composants React en arrow functions.
- Utiliser async/await, jamais .then().
- Logger Pino obligatoire (`logger.error()`, `logger.info()`), jamais console.log ou fs.appendFileSync.
- Messages d’erreur : anglais pour logs techniques, français pour API.
- Format d’erreur API : `{ error: "Message en français" }`.

## Backend (Express/Node.js)
- Validation des entrées via middlewares dans `middlewares/validators.js`.
- Authentification et rôles via middlewares (`auth.js`, `isAdmin.js`).
- Structure Route → Controller → Model → DB.
- Requêtes SQL paramétrées via `pool.query()` (`config/db.js`).
- Transactions PostgreSQL pour opérations multiples.
- Nettoyage des ressources (fermeture des connexions).

## Frontend (React/Vite)
- Utiliser hooks React (useState, useEffect, useContext, useNavigate).
- Séparer la logique métier des composants d’affichage.
- État global via Context API (`context/AuthContext.jsx`).
- CSS pur dans `styles/`, pas de Tailwind.
- Leaflet pour les cartes (`react-leaflet`).
- Axios pour les appels API (`services/api.js`).
- Socket.io pour le temps réel.
- Tests avec Vitest et @testing-library/react, E2E avec Cypress.
- Gestion d’erreur avec error boundaries si pertinent.

## Tests
- Toujours créer des tests pour les nouvelles fonctionnalités.
- Jest pour le backend (`backend/tests/`), Vitest pour le frontend (`frontend/test/`).
- Couverture minimale : 80%.
- Nommer les tests en français.
- Structure : tests unitaires `.unit.test.js`, intégration `.test.js`, E2E Cypress dans `frontend/cypress/`.

## Base de données
- Pool de connexions PostgreSQL dans `backend/config/db.js`.
- Migrations SQL dans `backend/sql/` (numérotation séquentielle).
- Transactions pour opérations liées.
- Nettoyage des ressources après usage.

## Sécurité
- Jamais exposer de données sensibles dans les logs.
- Valider/sanitiser toutes les entrées utilisateur.
- JWT pour l’authentification, vérification des rôles.
- Requêtes SQL paramétrées.

## Documentation
- Commenter les fonctions complexes avec JSDoc en français.
- Expliquer le « pourquoi » dans les commentaires.
- Mettre à jour la documentation à chaque changement important.
- Exemples d’utilisation pour les nouvelles APIs.
- Documenter les variables d’environnement requises.

## Docker
- Respecter les conventions du projet (fichiers Dockerfile, docker-compose.yml).

## Format des réponses
- Être concis, complet et direct.
- Toujours répondre en français.
- Expliquer les changements importants et leur impact.
- Proposer des alternatives si pertinent.
- Signaler les problèmes ou effets de bord.
- Fournir des exemples de code si nécessaire.
- Utiliser des emojis pour clarifier.

## Approche de résolution
- Comprendre le contexte avant de proposer une solution.
- Privilégier la robustesse et la maintenabilité.
- Suivre les patterns du projet.
- Suggérer des améliorations si besoin.
- Corriger le code existant si non conforme.
- Vérifier la cohérence backend/frontend.
- **Ne jamais implémenter ou proposer des fichiers volumineux, monolithiques ou difficilement évolutifs. Privilégier la modularité, la séparation des responsabilités et la maintenabilité.**
# 🚦 Récapitulatif d'avancement global (Décembre 2025)

## Backend
- Logs & monitoring automatisés (Pino, CI/CD, alertes Slack)
- Sécurité avancée (JWT, rôles, validation, requêtes SQL paramétrées)
- Structure claire : routes, contrôleurs, modèles, middlewares
- Couverture de tests >80% (Jest)

## Frontend
- UX optimisée, responsive, accessibilité renforcée
- Cartes interactives (react-leaflet, clustering, coloration)
- Context API, hooks, séparation logique/affichage
- Nettoyage exhaustif du lint (unused vars, blocs vides, console, hooks)
- Couverture de tests >80% (Vitest, Cypress)

## CI/CD & Qualité
- Automatisation complète (lint, tests, artefacts, monitoring)
- Documentation centralisée et à jour
- Docker prêt pour dev et prod

## Points restants
- Finaliser la suppression des derniers warnings (console, hooks, Fast Refresh)
- QA finale et enrichissement documentation utilisateur
- Tests E2E sur tous les parcours critiques

---

# 🧪 Stratégie de tests robustes pour les formulaires React

Pour garantir la fiabilité des tests d'intégration sur les formulaires React (Vitest/jsdom), il est recommandé d'utiliser systématiquement `fireEvent.change` pour modifier la valeur des champs (inputs, textarea) au lieu de `user.clear` ou `user.type`.

**Exemple :**

```jsx
// Mauvais (peut échouer en jsdom)
await user.clear(input);
await user.type(input, 'Nouvelle valeur');

// Recommandé
fireEvent.change(input, { target: { value: 'Nouvelle valeur' } });
```

Cette méthode évite les erreurs de focus et de clear, et fonctionne dans tous les environnements de test.

**Tests concernés :**
- ExploreRepairs.full.test.jsx
- ExploreRepairs.offerDates.test.jsx
- Profile.test.jsx

💡 Pensez à toujours associer les labels aux inputs avec `htmlFor`/`id` pour permettre le ciblage par `findByLabelText`.
# 🚲 Velo Platform

Plateforme de gestion de vélos et de demandes de réparation, connectant clients et réparateurs.

## 📋 Fonctionnalités

- **Gestion de vélos** : ajout, modification, suivi des composants
- **Demandes de réparation** : création et gestion des demandes
- **Offres de réparation** : système de mise en relation clients/réparateurs
- **Authentification** : JWT avec rôles (client, réparateur, admin)
- **Géolocalisation** : carte interactive pour localiser les réparations
- **Notifications améliorées** : toasts élaborées avec actions et descriptions
- **Géolocalisation automatique** : détection de position avec reverse geocoding

## 🤖 Système d'Amélioration Continue (Phases 1-3)

### Phase 1: Monitoring & Détection Automatique ✅
Surveillance 24/7 de la plateforme avec **détection anomalies** en temps réel.

```javascript
// Collecte automatique à chaque requête
- Latence (P95, P99)
- Taux d'erreur (500, 4xx, 5xx)
- Uptime et disponibilité
- Calcul Health Score (0-100)
- Détection taux erreur > 1%, latence > 2s
```

**Routes API**:
```bash
GET  /api/metrics/health           # Health score (public)
GET  /api/metrics/metrics          # Métriques détaillées (admin)
GET  /api/metrics/recommendations  # Recommandations (admin)
```

**Exemple**:
```bash
curl http://localhost:5000/api/metrics/health
# {
#   "healthScore": 82,
#   "uptime": "2h 34m",
#   "errorRate": 1.2,
#   "avgLatency": 245ms,
#   "status": "HEALTHY"
# }
```

### Phase 2: Auto-Corrections & GitHub ✅
Exécution automatique de corrections + création d'issues GitHub.

```javascript
// Corrections disponibles
- rotate-logs: Supprime logs > 7 jours
- clear-cache: Nettoie cache obsolète
- reconnect-db: Reconnecte pool PostgreSQL

// Créer issues GitHub automatiquement
- Sévérité détectée (CRITICAL, HIGH, MEDIUM)
- Labels: p0, p1, p2, p3
- Description complète avec contexte
```

**Routes Admin**:
```bash
GET    /api/admin/auto-fixes                    # Historique
POST   /api/admin/auto-fixes/enable             # Activer
POST   /api/admin/auto-fixes/disable            # Désactiver
POST   /api/admin/auto-fixes/dry-run            # Mode simulation
GET    /api/admin/github-issues                 # Issues créées
```

### Phase 3: Prédictions ML & Recommandations ✅
Algorithmes ML pour prédire et recommander des actions.

```javascript
// Algorithmes
- Exponential Smoothing: Prédictions tendance
- Z-score Detection: Anomalies statistiques
- Correlation Analysis: Détecte saisonnalité

// Recommandations générées
"Erreurs augmentent → analyser logs"
"Latence augmente → optimiser DB"
"Volume augmente → pré-scaler demain"
```

**Routes Admin**:
```bash
GET /api/admin/predictions                     # Prédictions + recommendations
GET /api/admin/ci/anomalies-detected           # Anomalies actuelles
GET /api/admin/ci/system-health                # Santé globale
GET /api/admin/ci/status                       # État global
```

## ✨ Améliorations Récentes (Décembre 2025)

### 🔔 Notifications Toast Élaborées
**Frontend/Context/ToastContext.jsx**
- Toasts avec descriptions et actions supplémentaires
- Animations smooth (slideInRight)
- Support pour actions utilisateur (boutons d'action)
- Types: success, error, warning, info, loading
- Styling adaptatif avec dégradés subtils

```javascript
// Utilisation
const toast = useToast();

// Toast simple
toast.success('Opération réussie');

// Toast avec description et action
toast.success('Localisation trouvée', 3000, {
  description: '48.8566°N, 2.3522°E',
  actionLabel: 'Afficher sur la carte',
  action: () => { /* handler */ }
});

// Toast de chargement
const id = toast.loading('Traitement en cours...');
// ... plus tard
toast.removeToast(id);
```

### 📍 Géolocalisation Automatique
**Frontend/hooks/useGeolocation.js**
- Hook React pour géolocalisation native du navigateur
- Reverse geocoding via API Nominatim (OpenStreetMap)
- Calcul de distance Haversine entre deux points
- Gestion intelligente des permissions

```javascript
// Utilisation
const { location, loading, requestLocation } = useGeolocation();

// Appeler la géolocalisation
await requestLocation();
// → Lance automatiquement toast avec adresse trouvée

// Calculer distance entre réparateurs et client
const distance = getDistance(
  clientLat, clientLng,
  repairerLat, repairerLng
); // résultat en km
```

**Intégration dans RepairForm**:
- Bouton "📍 Utiliser ma position" dans étape localisation
- Auto-remplissage du formulaire avec latitude/longitude
- Adresse automatique via reverse geocoding
- Toast de confirmation avec coordonnées

**Bénéfices**:
✅ Meilleure exp utilisateur (moins de saisie)
✅ Données de localisation précises
✅ Aide le matching client↔réparateur par proximité
✅ Compatible avec tous les navigateurs modernes

## 🛠️ Technologies
## 🔒 Sécurité Backend

### Authentification JWT
- Utilisation de tokens JWT signés avec un secret fort (variable d'environnement `JWT_SECRET`)
- Les tokens incluent l'id, l'email et le rôle de l'utilisateur
- Expiration configurable (`expiresIn: '7d'` par défaut)
- Vérification systématique du token sur les routes protégées
- Gestion des erreurs JWT centralisée

### Gestion des rôles
- Rôles validés à l'inscription (`client`, `repairer`, `admin`)
- Middlewares `requireRole` et `isAdmin` pour protéger les routes sensibles
- Contrôles explicites et messages clairs en cas d'accès interdit

### Validation et Sanitisation avancée
- Utilisation d'`express-validator` pour toutes les entrées critiques
- Contrôle du type, format, longueur, inclusion dans une liste
- Sanitisation automatique (escape HTML) sur tous les champs texte libres (titre, description, message, bio, compétences, etc.)
- Protection contre les injections XSS et les données malicieuses

### Bonnes pratiques
- Ne jamais exposer le secret JWT ou des données sensibles dans les logs
- Toujours valider et nettoyer les entrées utilisateur
- Utiliser des requêtes SQL paramétrées pour éviter les injections

---

### Backend
- **Node.js** + Express
- **PostgreSQL** (base de données)
- **Pino** (logging structuré)
- **JWT** (authentification)
- **Jest** (tests unitaires)

### Frontend
- **React** + Vite
- **React Router** (navigation)
- **Leaflet** (cartes interactives)
- **Axios** (requêtes API)
- **Vitest** + Cypress (tests)

## 🚀 Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Cloner le repository
```bash
git clone https://github.com/barth38140-png/velo-platform.git
cd velo-platform
```

### 2. Configuration Backend

```bash
cd backend
npm install
```

Créer un fichier `.env` :
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_NAME=velo_platform

# JWT
JWT_SECRET=your_secret_key_here_change_in_production

# CI System - Phase 1
CONTINUOUS_IMPROVEMENT_ENABLED=true
CI_CHECK_INTERVAL=60000

# CI System - Phase 2
AUTO_FIXER_ENABLED=true
AUTO_FIXER_DRY_RUN=false

# CI System - Phase 3
PREDICTIVE_ANALYTICS_ENABLED=true
ML_WINDOW_SIZE=1000
ML_FORECAST_HORIZON=24

# GitHub (optionnel, pour auto-issues)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_OWNER=barth38140-png
GITHUB_REPO=velo-platform

# Slack (optionnel, pour notifications)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_SEND_ALERTS=true
SLACK_SEND_DAILY_REPORTS=true
```

```bash
# Créer la base
psql -U postgres -c "CREATE DATABASE velo_platform;"

# Appliquer les migrations
npm run migrate
```

### 3. Configuration Frontend

```bash
cd ../frontend
npm install
```

Créer un fichier `.env` :
```env
VITE_API_URL=http://localhost:5000
```

## 🏃 Démarrage

### Mode développement

**Backend** (terminal 1) :
```bash
cd backend
npm run dev
```
→ API disponible sur http://localhost:5000

**Frontend** (terminal 2) :
```bash
cd frontend
npm run dev
```
→ Interface disponible sur http://localhost:5173

### Mode production avec Docker

```bash
# Lancer tous les services (PostgreSQL, Backend, Frontend)
docker-compose -f docker-compose.dev.yml up

# Accéder:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:5000
# - PostgreSQL: localhost:5432
```

### Tester le système CI

```bash
# Health check (pas d'auth)
curl http://localhost:5000/api/metrics/health | jq .

# Obtenir un token admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' | jq -r '.token')

# Test Phase 1: Monitoring
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/ci/status | jq .

# Test Phase 2: Auto-Fixes
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/auto-fixes | jq .

# Test Phase 3: Predictions
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/predictions | jq .
```

## 🚀 Installation

## 🧪 Tests

### Backend
```bash
cd backend
npm test              # Tests unitaires
npm run test:integration  # Tests d'intégration
npm run test:coverage     # Avec couverture
```

### Frontend
```bash
cd frontend
npm run test          # Tests unitaires (Vitest)
npm run test:ui       # Interface de tests
npm run cypress       # Tests E2E
```

## 🏗️ Architecture du Système CI

### Vue Globale

```
┌──────────────────────────────────────────────────────────┐
│             VELO PLATFORM (Métier)                       │
│  - Gestion vélos, réparations, messaging, disponibilités │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│    CONTINUOUS IMPROVEMENT SYSTEM (24/7 Autonome)        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Phase 1: MONITORING                                     │
│  ├─ ContinuousImprovement: Collecte + Calcul            │
│  ├─ AnomalyDetector: Détecte anomalies                  │
│  └─ NotificationService: Alertes Slack/Email            │
│                     ↓                                     │
│  Phase 2: AUTO-FIXES & GITHUB                           │
│  ├─ AutoFixer: Corrections auto (rotate-logs, etc)      │
│  └─ GitHubIntegration: Issues GitHub auto               │
│                     ↓                                     │
│  Phase 3: PRÉDICTIONS ML                                │
│  ├─ PredictiveAnalytics: Exponential Smoothing          │
│  ├─ Z-score Detection: Anomalies statistiques           │
│  └─ Recommendations: Actions suggérées                  │
│                                                           │
└──────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│              PostgreSQL Database                         │
│  - 12+ tables, 7 migrations, contraintes avancées       │
└──────────────────────────────────────────────────────────┘
```

### Flow d'Exécution

```
T+0s    Service démarre → Init monitoring

T+1s    Requête HTTP arrive → Enregistrée (latency, status)

T+60s   HEALTH CHECK (chaque minute)
        ├─ Calculer: uptime, error rate, latency, health score
        ├─ Détecter anomalies
        └─ Exécuter auto-fixes si trouvé

T+3600s PRÉDICTIONS ML (chaque heure)
        ├─ Exponential Smoothing
        ├─ Seasonality detection
        └─ Recommandations

T+86400s RAPPORT QUOTIDIEN (24h)
        ├─ Synthèse
        ├─ Auto-fixes exécutés
        ├─ Issues GitHub
        └─ Slack notification
```

## 🔌 Routes API Complètes

### Admin - Monitoring (Phase 1)
```bash
GET    /api/admin/ci/status                       # État global
GET    /api/admin/ci/system-health                # Santé système
POST   /api/admin/ci/force-health-check           # Forcer vérification
GET    /api/admin/ci/anomalies-detected?limit=100 # Anomalies actuelles
GET    /api/admin/ci/logs?limit=200&type=auto-fixes # Logs centralisés
```

### Admin - Auto-Fixes (Phase 2)
```bash
GET    /api/admin/auto-fixes?limit=50             # Historique
POST   /api/admin/auto-fixes/enable               # Activer
POST   /api/admin/auto-fixes/disable              # Désactiver
POST   /api/admin/auto-fixes/dry-run              # Mode simulation
GET    /api/admin/github-issues                   # Issues créées
```

### Admin - Prédictions ML (Phase 3)
```bash
GET    /api/admin/predictions                     # Prédictions + recommendations
```

### Métier - Authentification
```bash
POST   /api/auth/register                         # Inscription
POST   /api/auth/login                            # Connexion
```

### Métier - Vélos
```bash
GET    /api/bikes                                 # Liste
POST   /api/bikes                                 # Créer
PUT    /api/bikes/:id                             # Modifier
DELETE /api/bikes/:id                             # Supprimer
```

### Métier - Réparations
```bash
GET    /api/repairs                               # Liste
POST   /api/repairs                               # Créer
GET    /api/repairs/:id                           # Détail
PATCH  /api/repairs/:id                           # Modifier
```

### Métier - Offres de Réparation
```bash
POST   /api/repair-offers                         # Créer
PATCH  /api/repair-offers/:id/accept              # Accepter
PATCH  /api/repair-offers/:id/reject              # Rejeter
POST   /api/repair-offers/:id/propose-date        # Proposer date
PATCH  /api/repair-offers/:id/confirm-date        # Confirmer date
```

### Métier - Disponibilités
```bash
GET    /api/availability/:repairerId              # Voir slots
POST   /api/availability                          # Créer slot
DELETE /api/availability/:slotId                  # Supprimer slot
POST   /api/availability/:slotId/reserve          # Réserver
```

### Métier - Conversations & Messages
```bash
GET    /api/conversations                         # Lister
POST   /api/conversations                         # Créer
GET    /api/conversations/:id/messages            # Messages
POST   /api/conversations/:id/messages            # Envoyer message
```

### Métier - Reviews
```bash
POST   /api/reviews                               # Créer review
GET    /api/reviews/:repairerId                   # Reviews repairer
```

### Métier - Notifications
```bash
POST   /api/push/subscribe                        # S'abonner
DELETE /api/push/subscribe/:endpointId            # Se désabonner
```

## 📊 Structure Backend Complète

```
backend/
├── src/
│   ├── index.js                          # Point d'entrée principal
│   ├── logger.js                         # Pino logger
│   │
│   ├── continuousImprovement.js          # Phase 1: Monitoring
│   ├── anomalyDetector.js                # Phase 1b: Détection anomalies
│   ├── autoFixer.js                      # Phase 2: Auto-corrections
│   ├── githubIntegration.js              # Phase 2: GitHub API
│   ├── predictiveAnalytics.js            # Phase 3: ML Predictions
│   └── notifications.js                  # Slack/Email alerts
│
├── config/
│   └── db.js                             # PostgreSQL pool
│
├── models/                               # Data models (11)
│   ├── userModel.js
│   ├── bikeModel.js
│   ├── repairModel.js
│   ├── repairOfferModel.js
│   ├── conversationModel.js
│   ├── messageModel.js
│   ├── locationModel.js
│   ├── repairPhotoModel.js
│   ├── availabilityModel.js
│   └── ...
│
├── controllers/                          # Business logic (13)
│   ├── userController.js
│   ├── bikeController.js
│   ├── repairController.js
│   ├── repairOfferController.js
│   ├── conversationController.js
│   ├── messageController.js
│   ├── locationController.js
│   └── ...
│
├── routes/                               # API routes (25)
│   ├── authRoutes.js
│   ├── bikeRoutes.js
│   ├── repairRoutes.js
│   ├── repairOfferRoutes.js
│   ├── conversationRoutes.js
│   ├── messageRoutes.js
│   ├── availabilityRoutes.js
│   ├── metricsRoutes.js                  # Phase 1 API
│   ├── adminRoutes.js                    # Phase 2-3 API
│   └── ...
│
├── middlewares/
│   ├── auth.js                           # JWT verification
│   ├── isAdmin.js                        # Admin check
│   ├── validators.js                     # Input validation
│   └── errorHandler.js                   # Error handling
│
├── sql/                                  # Database migrations (7)
│   ├── 001_create_bikes_tables.sql
│   ├── 002_add_repair_related_tables.sql
│   ├── 003_add_conversations_messages.sql
│   ├── 004_add_reviews_push_notifications.sql
│   ├── 005_add_date_negotiation_to_offers.sql
│   ├── 006_add_review_notifications.sql
│   └── 007_repairer_availability.sql
│
├── scripts/
│   ├── seed_bike_models.js
│   ├── apply_migrations.js
│   └── test-phases-2-3.sh
│
├── tests/                                # Test files
│   └── ...
│
├── logs/                                 # Structured JSON logs
│   └── app.log
│
├── package.json
├── jest.config.js
├── .eslintrc.js
└── Dockerfile
```

## 🧪 Tests

## 📁 Structure Frontend

```
frontend/
├── src/
│   ├── App.jsx                           # Point d'entrée
│   ├── main.jsx                          # Rendu React
│   │
│   ├── components/                       # 40+ composants React
│   │   ├── AuthForm.jsx
│   │   ├── Dashboard.jsx
│   │   ├── BikeForm.jsx
│   │   ├── RepairForm.jsx
│   │   ├── MessageThread.jsx
│   │   ├── ReviewModal.jsx
│   │   ├── DateNegotiationModal.jsx
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── BikesPage.jsx
│   │   ├── RepairsPage.jsx
│   │   ├── ConversationsPage.jsx
│   │   ├── RepairerAvailability.jsx
│   │   └── ...
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx               # Auth globale
│   │   ├── ToastContext.jsx              # Notifications toast
│   │   └── ConfirmContext.jsx            # Confirmations
│   │
│   ├── services/
│   │   ├── api.js                        # Appels API centralisés
│   │   ├── socket.js                     # Socket.io setup
│   │   └── pushNotifications.js          # Web Push
│   │
│   └── styles/
│       ├── index.css
│       ├── components.css
│       └── ...
│
├── test/                                 # Vitest tests
├── cypress/                              # E2E tests
├── public/
│   ├── service-worker.js                 # Web Push worker
│   └── manifest.json
│
├── vite.config.js
├── vitest.config.js
└── package.json
```

## 🔒 Sécurité Implémentée

### Authentication & Authorization
✅ **JWT Authentication** - Tokens 24h expiration
✅ **RBAC** - user, repairer, admin roles
✅ **Admin Protection** - Routes /api/admin protégées par middleware

### Headers & Protection
✅ **Helmet.js** - CSP, HSTS, X-Frame-Options
✅ **CORS** - Whitelist origins (dev: tous, prod: liste)
✅ **Rate Limiting** - 100 req/15min global, 5 tentatives login

### Data Protection
✅ **SQL Injection Prevention** - Queries paramétrées avec pg
✅ **XSS Protection** - Input sanitization (express-validator)
✅ **Password Hashing** - bcryptjs (10 rounds)
✅ **Secrets Management** - Variables d'environnement (.env)

### Logging & Audit
✅ **Audit Logging** - Tous les logs en JSON (Pino)
✅ **Error Logging** - Pas de données sensibles en logs
✅ **Access Logs** - Traçabilité complète

### Best Practices

```bash
# 1. Générer JWT_SECRET fort
openssl rand -base64 32

# 2. Générer GitHub token (optionnel)
# https://github.com/settings/tokens (scopes: repo, read:org)

# 3. Configurer HTTPS en production (Nginx/reverse proxy)

# 4. Changer tous les passwords par défaut

# 5. Monitorer les logs d'erreur
tail -f backend/logs/app.log | jq 'select(.level >= 40)'

# 6. Activer rate limiting avant prod
```

## 🚀 CI/CD Automatisé - Workflow DevOps Complet

### Vue d'Ensemble

Le système CI/CD automatisé permet un déploiement continu avec assistance IA, corrections automatiques et monitoring en temps réel.

```
┌──────────────────────────────────────────────────────────────┐
│                  WORKFLOW CI/CD COMPLET                      │
└──────────────────────────────────────────────────────────────┘
         │
         │ 1. git push (commit)
         ▼
┌─────────────────────────────────────────┐
│  🚀 main-ci-cd.yml (Pipeline Principal) │
├─────────────────────────────────────────┤
│  ✅ Phase 1: Lint & Analyse Statique    │
│  ✅ Phase 2: Tests Backend + Coverage    │
│  ✅ Phase 3: Tests Frontend (Vitest)     │
│  ✅ Phase 4: Tests E2E (Cypress)         │
│  ✅ Phase 5: Audit Sécurité (npm audit) │
│  ✅ Phase 6: Build Docker Images         │
│  ✅ Phase 7: Monitoring Health Check     │
│  ✅ Phase 8: Déploiement Production      │
└─────────────────────────────────────────┘
         │
         ├──────────────> Déclenche parallèlement:
         │
┌────────┴────────┬──────────────┬───────────────┐
│                 │              │               │
│  📊 monitoring  │  🤖 auto-fix │  🚀 deploy    │
│  .yml           │  .yml        │  .yml         │
│                 │              │               │
│  Toutes les 3h  │  Toutes 6h   │  Si main OK   │
│  - Health Check │  - Rotate    │  - Staging    │
│  - Anomalies    │    logs      │  - Production │
│  - Create       │  - Clear     │  - Rollback   │
│    Issues       │    cache     │  - Monitoring │
│                 │  - Optimize  │               │
│                 │    DB        │               │
└─────────────────┴──────────────┴───────────────┘
```

### 🎯 Workflows Disponibles

#### 1. **main-ci-cd.yml** - Pipeline CI/CD Principal
Déclenché à chaque push/PR sur `main`, `master`, `develop`, `ci/**`

**Phases d'exécution** :
1. **Lint & Analyse** : ESLint backend + frontend
2. **Tests Backend** : Jest avec PostgreSQL, coverage > 75%
3. **Tests Frontend** : Vitest (tests unitaires)
4. **Tests E2E** : Cypress (tests end-to-end complets)
5. **Audit Sécurité** : npm audit sur dépendances
6. **Build Docker** : Construction images backend + frontend
7. **Monitoring** : Vérification health score post-tests
8. **Déploiement** : Automatique si branch = main/master

```bash
# Voir le statut du pipeline
https://github.com/barth38140-png/velo-platform/actions

# Télécharger les artifacts
# - backend-coverage/
# - frontend-test-results/
# - cypress-artifacts/
# - ci-health-report.json
```

#### 2. **auto-fix.yml** - Corrections Automatiques
Déclenché toutes les 6h OU manuellement

**Corrections appliquées** :
- ✅ **rotate-logs** : Supprime logs > 7 jours
- ✅ **clear-cache** : Nettoie cache obsolète
- ✅ **optimize-db** : Reconnecte pool PostgreSQL

**Mode DRY-RUN** :
```bash
# Déclencher manuellement (simulation)
gh workflow run auto-fix.yml \
  --ref main \
  -f dry_run=true \
  -f fix_type=all

# Déclencher en production
gh workflow run auto-fix.yml \
  --ref main \
  -f dry_run=false \
  -f fix_type=rotate-logs
```

**Création d'Issues automatiques** :
- Si Health Score < 60 → Issue `p0` (CRITICAL)
- Si Health Score < 70 → Issue `p1` (HIGH)
- Si Health Score < 80 → Issue `p2` (MEDIUM)

#### 3. **monitoring.yml** - Surveillance Continue
Déclenché toutes les 3h OU après chaque déploiement

**Métriques surveillées** :
- 📊 Health Score (0-100)
- ❌ Taux d'erreur (%)
- ⏱️ Latence moyenne (ms)
- 📈 Latence P95, P99
- ⏰ Uptime (%)
- 📊 Nombre de requêtes

**Détection d'anomalies** :
```javascript
// Anomalies déclenchent actions:
if (healthScore < 75) → Créer Issue GitHub
if (errorRate > 1.0%) → Créer Issue + Alert
if (avgLatency > 400ms) → Créer Issue
if (p95Latency > 800ms) → Recommandation

// Auto-remédiation
if (anomalies détectées) → Déclencher auto-fix.yml
```

**Issues GitHub créées automatiquement** :
- `🚨 [MONITORING] Health Score 68 - CRITICAL`
- `🚨 [MONITORING] Taux d'erreur élevé: 2.3%`
- Labels: `monitoring`, `anomaly`, `p0/p1/p2`, `auto-generated`

#### 4. **deploy.yml** - Déploiement Production
Déclenché automatiquement après CI/CD réussi OU manuellement

**Pré-vérifications** :
1. ✅ CI/CD passé avec succès
2. ✅ Health Score ≥ 70
3. ✅ Pas d'anomalies critiques

**Environnements** :
- **Staging** : Branch `develop` → staging.velo-platform.example.com
- **Production** : Branch `main` → velo-platform.example.com

**Processus de déploiement** :
```bash
# 1. Build & Push Docker images vers GitHub Container Registry
ghcr.io/barth38140-png/velo-platform-backend:latest
ghcr.io/barth38140-png/velo-platform-frontend:latest

# 2. Déploiement (à personnaliser)
# Option A: Docker Compose sur VPS
ssh deploy@prod.example.com "cd /app && docker-compose pull && docker-compose up -d"

# Option B: Kubernetes
kubectl set image deployment/backend backend=ghcr.io/.../backend:$SHA
kubectl rollout status deployment/backend

# Option C: Cloud Provider
# AWS ECS, Google Cloud Run, Azure Container Instances, etc.

# 3. Health Check post-déploiement
curl -f https://velo-platform.example.com/api/health

# 4. Smoke Tests
curl -f https://velo-platform.example.com/api/metrics/health

# 5. Monitoring post-deploy (3h de surveillance)
```

**Rollback automatique** :
- Si health check échoue → Rollback vers version précédente
- Si smoke tests échouent → Rollback + Alerte

**Déclenchement manuel** :
```bash
# Déployer sur staging
gh workflow run deploy.yml \
  --ref main \
  -f environment=staging \
  -f version=v1.2.3

# Déployer sur production
gh workflow run deploy.yml \
  --ref main \
  -f environment=production \
  -f version=latest
```

### 🔄 Flow Complet - Exemple Réel

```
T+0s     👨‍💻 Développeur: git push origin main
         ├─ Commit: "feat: ajout système de notifications push"
         └─ Branch: main

T+10s    🚀 GitHub Actions: main-ci-cd.yml démarre
         ├─ Job 1: Lint (2 min)
         ├─ Job 2: Backend Tests (5 min)
         ├─ Job 3: Frontend Tests (3 min)
         └─ Job 4: E2E Tests (8 min)

T+8m     ✅ Tous les tests passent
         └─ Coverage: 82% ✅

T+10m    🐳 Build Docker Images
         ├─ Backend: ghcr.io/.../backend:abc123
         └─ Frontend: ghcr.io/.../frontend:abc123

T+15m    📊 Health Check
         └─ Health Score: 85 ✅

T+20m    🚀 Déploiement Production automatique
         ├─ Push images vers registry
         ├─ Update containers
         ├─ Health check post-deploy
         └─ Smoke tests

T+25m    ✅ Déploiement réussi
         └─ Tag créé: deploy-2025-12-04T10-30-00Z

T+30m    📊 monitoring.yml déclenché
         ├─ Vérification métriques
         ├─ Pas d'anomalie détectée
         └─ Monitoring continue (toutes les 3h)

T+3h     📊 monitoring.yml (vérification périodique)
         ├─ Health Score: 78
         ├─ Error Rate: 0.8%
         ├─ Avg Latency: 320ms
         └─ ✅ Tout OK

T+6h     🤖 auto-fix.yml (maintenance périodique)
         ├─ Rotation logs anciens
         ├─ Nettoyage cache
         └─ ✅ Maintenance OK
```

### 🛠️ Configuration Requise

#### Secrets GitHub (Settings → Secrets)
```bash
GITHUB_TOKEN              # Créé automatiquement
DOCKER_REGISTRY_TOKEN     # Pour push images (optionnel)
SLACK_WEBHOOK_URL         # Pour notifications Slack (optionnel)
```

#### Variables d'Environnement
```bash
# Backend .env
CONTINUOUS_IMPROVEMENT_ENABLED=true
AUTO_FIXER_ENABLED=true
PREDICTIVE_ANALYTICS_ENABLED=true
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_OWNER=barth38140-png
GITHUB_REPO=velo-platform
```

#### Badges GitHub (README.md)
```markdown
[![CI/CD](https://github.com/barth38140-png/velo-platform/actions/workflows/main-ci-cd.yml/badge.svg)](https://github.com/barth38140-png/velo-platform/actions)
[![Auto-Fix](https://github.com/barth38140-png/velo-platform/actions/workflows/auto-fix.yml/badge.svg)](https://github.com/barth38140-png/velo-platform/actions)
[![Monitoring](https://github.com/barth38140-png/velo-platform/actions/workflows/monitoring.yml/badge.svg)](https://github.com/barth38140-png/velo-platform/actions)
```

### Automatisation de l’installation monitoring (Docker Compose)

Ajoutez ce service à votre `docker-compose.dev.yml` pour lancer Grafana, Prometheus et Loki avec le backend :

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend/logs:/app/logs
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./backend/logs:/var/log
      - ./promtail-config.yaml:/etc/promtail/config.yaml
    command: -config.file=/etc/promtail/config.yaml
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on:
      - prometheus
      - loki
```

- Placez `prometheus.yml` et `promtail-config.yaml` à la racine du projet (exemples dans le README).
- Lancez tous les services avec : `docker-compose -f docker-compose.dev.yml up`
- Accédez à Grafana sur [http://localhost:3000](http://localhost:3000)

💡 Monitoring et alertes opérationnels en quelques minutes, sans configuration manuelle complexe.

### Documentation
- Ajouter la procédure d’installation Grafana/Prometheus dans le README.md principal.
- Expliquer comment connecter les logs et les métriques.
- Documenter les alertes et les seuils critiques.

💡 Résultat : visibilité temps réel, alertes proactives, amélioration continue pilotée par les données.

### Automatisation de la vérification des logs (script Node.js)

Ajoutez ce script dans `backend/scripts/check_logs.js` pour analyser automatiquement les erreurs dans les logs :

```javascript
const fs = require('fs');
const path = require('path');
const logPath = path.join(__dirname, '../logs/app.log');

fs.readFile(logPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Impossible de lire le fichier de logs:', err);
    process.exit(1);
  }
  const errors = data.match(/error|fatal|warn/gi);
  if (errors && errors.length > 0) {
    console.log(`⚠️  ${errors.length} erreurs/warnings détectés dans les logs.`);
    process.exit(2);
  } else {
    console.log('✅ Aucun problème détecté dans les logs.');
    process.exit(0);
  }
});
```

- Lancez la vérification avec : `node backend/scripts/check_logs.js`
- Intégrez ce script dans votre pipeline CI/CD pour automatiser l’analyse à chaque build ou déploiement.

💡 Personnalisez les mots-clés ou actions selon vos besoins (ex : envoi d’alerte, création d’issue GitHub).

### Exemple d’intégration du check_logs dans GitHub Actions

Ajoutez cette étape à votre workflow `.github/workflows/ci-cd.yml` :

```yaml
- name: Vérification automatique des logs
  run: |
    node backend/scripts/check_logs.js
```

💡 Si le script détecte des erreurs/warnings, le job CI échouera (exit code 2), ce qui permet d’alerter l’équipe et d’empêcher le déploiement.

➡️ Placez cette étape après les tests et avant le build/deploy pour garantir la qualité en continu.

### Exemple d’alerte Slack ou création d’issue GitHub en cas d’erreur logs (GitHub Actions)

#### Alerte Slack
```yaml
- name: Alerte Slack si erreurs détectées
  if: failure()
  run: |
    curl -X POST -H 'Content-type: application/json' --data '{"text":"🚨 Erreurs détectées dans les logs Velo Platform !"}' $SLACK_WEBHOOK_URL
```

#### Création d’issue GitHub
```yaml
- name: Créer une issue GitHub si erreurs détectées
  if: failure()
  uses: peter-evans/create-issue-from-file@v4
  with:
    title: "Erreur critique détectée dans les logs CI/CD"
    content-filepath: backend/logs/app.log
    labels: bug, logs, ci
    token: ${{ secrets.GITHUB_TOKEN }}
```

💡 Placez ces étapes après la vérification des logs pour automatiser la notification et le suivi des problèmes.
