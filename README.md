# 🚲 Velo Platform

Plateforme de gestion de vélos et de demandes de réparation, connectant clients et réparateurs.

## 📋 Fonctionnalités

- **Gestion de vélos** : ajout, modification, suivi des composants
- **Demandes de réparation** : création et gestion des demandes
- **Offres de réparation** : système de mise en relation clients/réparateurs
- **Authentification** : JWT avec rôles (client, réparateur, admin)
- **Géolocalisation** : carte interactive pour localiser les réparations

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

## 🛠️ Technologies

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

## 🔧 Troubleshooting

### Le serveur ne démarre pas

```bash
# 1. Vérifier Node/npm
node --version  # v24+
npm --version   # 11+

# 2. Vérifier PostgreSQL
psql -U postgres -c "SELECT 1"

# 3. Installer dépendances
cd backend && npm install

# 4. Vérifier .env
cat .env | grep DB_

# 5. Vérifier port 5000
lsof -i :5000
```

### Routes /api/admin non trouvées

```bash
# 1. Vérifier que middleware auth fonctionne
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:5000/api/admin/ci/status
# Doit retourner: { error: "Invalid or expired token" }

# 2. Générer token admin valide
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' | jq -r '.token')

# 3. Tester avec token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/ci/status | jq .
```

### Auto-Fixes ne s'exécutent pas

```bash
# 1. Vérifier variables env
grep AUTO_FIXER backend/.env

# Doit afficher:
# AUTO_FIXER_ENABLED=true
# AUTO_FIXER_DRY_RUN=false (ou true pour simulation)

# 2. Vérifier les logs
tail -f backend/logs/app.log | grep -i "auto-fix\|anomaly"

# 3. Forcer une vérification de santé
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/ci/force-health-check

# 4. Voir anomalies détectées
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/ci/anomalies-detected | jq .
```

### Prédictions ML ne s'affichent pas

```bash
# 1. Vérifier PREDICTIVE_ANALYTICS_ENABLED=true
grep PREDICTIVE backend/.env

# 2. Attendre 1 heure (prédictions générées toutes les heures)

# 3. Vérifier les données accumulées
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/predictions | jq '.metricsSnapshot'
```

### GitHub issues ne sont pas créées

```bash
# 1. Vérifier le token
grep GITHUB_TOKEN backend/.env | head -c 30
# Doit commencer par: ghp_

# 2. Tester le token
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user | jq '.login'

# 3. Vérifier que l'anomalie est CRITICAL
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/ci/anomalies-detected | jq '.anomalies[] | select(.severity=="CRITICAL")'
```

## 🚀 Quick Commands

```bash
# Setup & Démarrage
cd backend && npm install && npm run dev        # Backend
cd frontend && npm install && npm run dev       # Frontend
npm test                                         # Tests
docker-compose -f docker-compose.dev.yml up    # Docker

# Admin Check
curl http://localhost:5000/api/metrics/health | jq .
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/ci/status | jq .

# Logs
tail -f backend/logs/app.log                     # Live logs
tail -f backend/logs/app.log | jq 'select(.level >= 40)'  # Erreurs seulement

# Database
npm run migrate                                  # Apply migrations
psql -U postgres -d velo_platform -c "SELECT * FROM users;"

# Build & Deploy
npm run build                                    # Build production
docker build -t velo-backend:latest backend/   # Docker build
docker push your-registry/velo-backend:latest   # Docker push
```

## 📊 Cas d'Usage & Exemples

### Scenario 1: Taux d'Erreur Élevé (Auto-Correction)

```
T+60s: System détecte error rate = 5% (seuil: 1%)
       └─ Sévérité: CRITICAL

T+75s: AutoFixer.execute("reconnect-db")
       └─ Database reconnectée

T+90s: GitHubIntegration.createIssue()
       └─ Issue #156 créée dans GitHub

T+120s: Error rate revient à 0.5% ✅
```

### Scenario 2: Latence en Augmentation (Prédiction)

```
T+3600s: PredictiveAnalytics.generateForecast()
         ├─ Hier: P95 latency = 250ms
         ├─ Aujourd'hui: P95 latency = 1800ms
         └─ Demain (prédit): P95 latency = 2800ms ⚠️

Recommandation: "Optimiser requêtes DB ou pré-scaler demain"
```

### Scenario 3: Saisonnalité Détectée

```
T+7200s: PredictiveAnalytics.detectSeasonality()
         └─ Pic de trafic chaque JEUDI 14h (correlation: 0.87)

Recommandation: "Pré-scaler jeudi matin avant le pic"
```

## 🔐 Sécurité

- **Authentification JWT** avec expiration
- **Validation des entrées** via middlewares
- **Headers de sécurité** (Helmet.js)
- **Rate limiting** sur routes sensibles
- **Requêtes SQL paramétrées** (protection injection SQL)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit les changements (`git commit -m 'Ajout fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

### Conventions de code
- **Backend** : CommonJS, async/await, logger Pino
- **Frontend** : ESM, arrow functions pour composants, CSS pur
- **Tests** : couverture minimale 80%
- **Commits** : messages en français, descriptifs

## 🎯 Prochaines Phases (Phase 4+)

Documentées pour implémentation future:

### Phase 4a: Modèles ML Avancés
- [ ] Prophet pour forecasting
- [ ] LSTM pour patterns complexes
- [ ] Isolation Forest pour anomalies
- [ ] Clustering intelligent

### Phase 4b: Auto-génération PRs
- [ ] Créer PRs automatiques avec fixes
- [ ] Suggestions de code via patterns ML
- [ ] Tests automatiques des fixes
- [ ] Staging deployment auto
- [ ] Auto-merge si tests ✅

### Phase 4c: Cost Optimization
- [ ] Analyser utilisation ressources
- [ ] Recommander rightsizing
- [ ] Budget forecasting

### Phase 4d: Capacity Planning
- [ ] Projeter charge future
- [ ] Scaling timing recommandé
- [ ] Resource optimization

## 📝 Licence

MIT

## 👥 Auteurs

- **Barth38140** - [GitHub](https://github.com/barth38140-png)

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contact : [votre-email@example.com]
