# Phases 2 & 3 - Amélioration Continue Auto-Fixes et Prédictions ML

## 📋 Vue d'ensemble

Les Phases 2 et 3 implémentent le système d'auto-corrections automatiques et les prédictions ML pour anticiper les problèmes avant qu'ils ne surviennent.

---

## 🔧 Phase 2: Auto-Fixes & GitHub Integration

### Composants Implémentés

#### 1. **AutoFixer** (`backend/src/autoFixer.js`)

Classe responsable de l'exécution automatique de corrections sur les anomalies.

**Fonctionnalités:**
- ✅ Système modulaire de fixes avec conditions
- ✅ Mode simulation (dry-run) pour tester sans impacter
- ✅ Approbation obligatoire pour fixes critiques
- ✅ Logging complèt de toutes les exécutions
- ✅ Statistiques de succès/échecs

**Fixes Implémentés:**
- `rotate-logs`: Supprime les logs > 7 jours
- `clear-stale-cache`: Nettoie le cache obsolète
- `reconnect-db`: Reconnecte le pool PostgreSQL

**API:**

```javascript
const { AutoFixer } = require('./src/autoFixer');

const autoFixer = new AutoFixer({
  enabled: true,
  dryRun: false,
  requireApproval: ['dbMigrations', 'productionChanges']
});

// Exécuter les auto-fixes pour les anomalies détectées
const results = await autoFixer.executeAutoFixes(anomalies);
// Résultat: [{ fixId, status: 'success'|'error'|'skipped', message }]

// Obtenir l'historique
const log = autoFixer.getExecutionLog(limit = 50);

// Statistiques
const stats = autoFixer.getStats();
// { total, successful, failed, successRate, lastExecution }
```

**Exemples d'Usage:**

```bash
# Tester un auto-fix en mode simulation
curl -X POST http://localhost:5000/api/admin/auto-fixes/dry-run \
  -H "Authorization: Bearer $TOKEN"

# Activer les auto-fixes en production
curl -X POST http://localhost:5000/api/admin/auto-fixes/enable \
  -H "Authorization: Bearer $TOKEN"

# Voir l'historique des auto-fixes
curl http://localhost:5000/api/admin/auto-fixes \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

#### 2. **GitHubIntegration** (`backend/src/githubIntegration.js`)

Intégration automatique avec GitHub pour créer des issues sur anomalies critiques.

**Fonctionnalités:**
- ✅ Création automatique d'issues GitHub
- ✅ Détection d'issues existantes (éviter les doublons)
- ✅ Labels basés sur la sévérité (p0, p1, p2, p3)
- ✅ Fermeture automatique quand l'anomalie est corrigée
- ✅ Commentaires sur les issues

**Configuration (.env):**

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=barth38140-png
GITHUB_REPO=velo-platform
```

**API:**

```javascript
const { GitHubIntegration } = require('./src/githubIntegration');

const github = new GitHubIntegration({
  token: process.env.GITHUB_TOKEN,
  owner: 'barth38140-png',
  repo: 'velo-platform'
});

// Créer une issue pour une anomalie
const issueResult = await github.createIssueForAnomaly(anomaly);
// Résultat: { created: true, issueNumber: 123, url: '...' }

// Fermer les issues liées à une anomalie
const closedIssues = await github.closeRelatedIssues('HIGH_ERROR_RATE');

// Ajouter un commentaire
await github.addCommentToIssue(123, 'Anomalie corrigée automatiquement');

// Rapport des issues créées
const report = github.getCreatedIssuesReport();
// { total, byType, recentIssues }
```

**Exemple d'Issue GitHub Créée:**

```
[CRITICAL] HIGH_ERROR_RATE - Taux d'erreur élevé (5.2% > 1%)

## 🚨 Détails de l'Anomalie

Type: HIGH_ERROR_RATE
Sévérité: CRITICAL
Message: Taux d'erreur élevé (5.2% > 1%)
Timestamp: 04/12/2025 14:32:15

## 📊 Contexte

{
  "value": 5.2,
  "threshold": 1,
  "autoFixable": true
}

## ✅ Actions Recommandées

- ✅ Cette anomalie peut être auto-réparée automatiquement
- [ ] Vérifier les logs associés
- [ ] Analyser les métriques détaillées
- [ ] Mettre en place une correction
- [ ] Tester en staging
- [ ] Déployer en production
```

---

### Routes Admin pour Phase 2

#### `POST /api/admin/auto-fixes/enable`
Active les auto-fixes en mode production.

```bash
curl -X POST http://localhost:5000/api/admin/auto-fixes/enable \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Réponse:**
```json
{
  "message": "Auto-fixes activés",
  "stats": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "successRate": "80.00%",
    "lastExecution": "2025-12-04T14:32:15.000Z"
  }
}
```

#### `POST /api/admin/auto-fixes/disable`
Désactive les auto-fixes.

#### `POST /api/admin/auto-fixes/dry-run`
Active le mode simulation (pas de modifications réelles).

#### `GET /api/admin/auto-fixes`
Historique des auto-fixes exécutés.

**Réponse:**
```json
{
  "executionLog": [
    {
      "fixId": "rotate-logs",
      "status": "success",
      "anomaly": "HIGH_DISK_USAGE",
      "timestamp": "2025-12-04T14:30:00.000Z"
    }
  ],
  "stats": { ... }
}
```

#### `GET /api/admin/github-issues`
Rapport des issues GitHub créées.

**Réponse:**
```json
{
  "total": 12,
  "byType": {
    "HIGH_ERROR_RATE": 5,
    "HIGH_LATENCY": 4,
    "DB_POOL_EXHAUSTED": 3
  },
  "recentIssues": [
    {
      "number": 156,
      "anomalyType": "HIGH_ERROR_RATE",
      "timestamp": "2025-12-04T14:32:15.000Z",
      "url": "https://github.com/barth38140-png/velo-platform/issues/156"
    }
  ]
}
```

---

## 🔮 Phase 3: Prédictions ML & Recommandations

### PredictiveAnalytics (`backend/src/predictiveAnalytics.js`)

Module pour prédire les anomalies futures et suggérer des actions proactives.

**Fonctionnalités:**
- ✅ Exponential Smoothing pour les prédictions
- ✅ Détection d'anomalies par écart-type (Z-score)
- ✅ Détection de saisonnalité/cycles
- ✅ Recommandations automatiques basées sur les tendances
- ✅ Fenêtre glissante des 1000 dernières métriques

**Algorithmes Utilisés:**

1. **Exponential Smoothing Simple**
   - Lisse les séries temporelles
   - Paramètre α (alpha) = 0.2-0.4
   - Avantage: Computation rapide, pas de dépendance ML

2. **Z-Score Anomaly Detection**
   - Identifie les valeurs déviantes
   - Threshold par défaut: 2.5 écarts-types
   - Robuste aux distributions multi-modales

3. **Pearson Correlation**
   - Détecte les cycles/saisonnalité
   - Compare corrélations à différents lags
   - Identifie la périodicité la plus probable

**API:**

```javascript
const { PredictiveAnalytics } = require('./src/predictiveAnalytics');

const analytics = new PredictiveAnalytics({
  windowSize: 1000,
  forecastHorizon: 24,  // heures
  confidenceLevel: 0.95
});

// Enregistrer une métrique
analytics.recordMetric('errorRates', 2.3);
analytics.recordMetric('latencies', 145);

// Générer les prédictions
const forecasts = await analytics.generateForecast();
/*
Résultat:
{
  errorRate: {
    predicted: 2.8,
    confidence: { lower: 2.24, upper: 3.36 },
    trend: 'increasing'
  },
  latency: {
    predicted: 152,
    confidence: { lower: 121.6, upper: 182.4 },
    trend: 'stable'
  },
  requestVolume: {
    predicted: 4500,
    confidence: { lower: 3600, upper: 5400 },
    trend: 'increasing'
  }
}
*/

// Détecter les anomalies par écart-type
const anomalies = analytics.detectAnomaliesByStdDev(values, threshold = 2.5);
/*
[
  {
    index: 15,
    value: 500,
    zScore: 3.2,
    expectedRange: { lower: 50, upper: 200 }
  }
]
*/

// Détecte la saisonnalité
const seasonality = analytics.detectSeasonality(values, seasonLength = 24);
/*
{
  seasonLength: 24,
  strength: 0.87,
  detectable: true
}
*/

// Recommandations automatiques
const recommendations = analytics.generateRecommendations();
/*
[
  {
    type: 'ERROR_TREND_INCREASING',
    severity: 'HIGH',
    title: 'Taux d\'erreur en augmentation',
    description: '...',
    action: 'Analyser les erreurs et identifier la cause racine',
    priority: 1
  }
]
*/
```

---

### Routes Admin pour Phase 3

#### `GET /api/admin/predictions`
Obtient les prédictions actuelles et recommandations.

**Réponse:**
```json
{
  "forecasts": {
    "errorRate": {
      "predicted": 2.8,
      "confidence": { "lower": 2.24, "upper": 3.36 },
      "trend": "increasing"
    },
    "latency": { ... },
    "requestVolume": { ... }
  },
  "recommendations": [
    {
      "type": "ERROR_TREND_INCREASING",
      "severity": "HIGH",
      "title": "Taux d'erreur en augmentation",
      "description": "Les erreurs augmentent. Vérifier les logs et déploiements récents.",
      "action": "Analyser les erreurs et identifier la cause racine",
      "priority": 1
    },
    {
      "type": "LATENCY_TREND_INCREASING",
      "severity": "MEDIUM",
      "title": "Latence en augmentation",
      "description": "Les temps de réponse augmentent. Considérer un scaling ou une optimisation.",
      "action": "Optimiser les requêtes lentes et les index DB",
      "priority": 2
    },
    {
      "type": "CAPACITY_PLANNING",
      "severity": "MEDIUM",
      "title": "Volume de requêtes en augmentation",
      "description": "La charge augmente. Planifier un scaling horizontal.",
      "action": "Augmenter la capacité des instances ou du cluster",
      "priority": 3
    }
  ],
  "metricsSnapshot": {
    "errorRateCount": 542,
    "latencyCount": 542,
    "requestCountCount": 542,
    "lastForecastTime": "2025-12-04T14:32:00.000Z",
    "forecasts": { ... }
  },
  "timestamp": "2025-12-04T14:32:15.000Z"
}
```

#### `GET /api/admin/ci/anomalies-detected`
Anomalies détectées actuellement.

```bash
curl "http://localhost:5000/api/admin/ci/anomalies-detected?limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Réponse:**
```json
{
  "total": 2,
  "anomalies": [
    {
      "type": "HIGH_ERROR_RATE",
      "severity": "HIGH",
      "message": "Taux d'erreur élevé (5.2% > 1%)",
      "value": 5.2,
      "threshold": 1,
      "autoFixable": true,
      "timestamp": "2025-12-04T14:32:15.000Z"
    }
  ],
  "metrics": {
    "uptime": "2h 34m",
    "requests": 12543,
    "errors": 654,
    "errorRate": 5.21,
    "avgLatency": 245,
    "p95Latency": 892,
    "healthScore": 62
  },
  "timestamp": "2025-12-04T14:32:15.000Z"
}
```

#### `GET /api/admin/ci/system-health`
Vue d'ensemble de la santé globale du système.

**Réponse:**
```json
{
  "score": 82,
  "status": "healthy",
  "uptime": "2h 34m",
  "requestCount": 12543,
  "errorRate": 2.1,
  "avgLatency": 145,
  "anomaliesCount": 0,
  "autoFixesStats": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "successRate": "80.00%",
    "lastExecution": "2025-12-04T14:30:00.000Z"
  },
  "recommendations": [
    {
      "type": "CAPACITY_PLANNING",
      "severity": "MEDIUM",
      "title": "Volume de requêtes en augmentation",
      "priority": 3
    }
  ]
}
```

---

## 🔄 Intégration en Continu

### Flow Complet (Phases 1 + 2 + 3)

```
┌─────────────────────────────────────────────────────────────┐
│              Collecte de Métriques (chaque req)              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│     Vérification de Santé (toutes les 1 minute)             │
│  - Calcul: uptime, errorRate, avgLatency, p95Latency       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│      Détection d'Anomalies (AnomalyDetector)                │
│  - Analyse des tendances                                     │
│  - Seuils configurables                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ↓                         ↓
┌──────────────┐    ┌──────────────────┐
│  Auto-Fixes  │    │  GitHub Issues   │
│  (Phase 2)   │    │   (Phase 2)      │
└──────────────┘    └──────────────────┘
    │                         │
    └────────────┬────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│   Prédictions ML (toutes les heures) (Phase 3)              │
│  - Exponential Smoothing                                     │
│  - Détection de saisonnalité                                 │
│  - Recommandations                                           │
└─────────────────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│    Rapport Quotidien (24h) (Phase 1)                        │
│  - Slack notification                                        │
│  - Email summary                                             │
└─────────────────────────────────────────────────────────────┘
```

### Configuration Complète (.env)

```env
# Phase 1: Monitoring
CONTINUOUS_IMPROVEMENT_ENABLED=true
CI_CHECK_INTERVAL=60000
CI_METRICS_FILE=./backend/metrics/current.json

# Phase 2: Auto-Fixes
AUTO_FIXER_ENABLED=true
AUTO_FIXER_DRY_RUN=false

# Phase 2: GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=barth38140-png
GITHUB_REPO=velo-platform

# Phase 3: Prédictions ML
PREDICTIVE_ANALYTICS_ENABLED=true
ML_FORECAST_HORIZON=24
ML_WINDOW_SIZE=1000

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ALERT_EMAIL=admin@velo-platform.com
```

---

## 🚀 Déploiement

### Activation en Production

```bash
# 1. Générer un token GitHub
# https://github.com/settings/tokens (select: repo, read:org)

# 2. Configurer le .env
echo "GITHUB_TOKEN=ghp_xxxxx" >> backend/.env
echo "AUTO_FIXER_ENABLED=true" >> backend/.env
echo "PREDICTIVE_ANALYTICS_ENABLED=true" >> backend/.env

# 3. Lancer le serveur
npm run start:backend

# 4. Vérifier l'activation
curl http://localhost:5000/api/admin/ci/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# 5. Voir la première anomalie créer une issue
# Les anomalies créeront automatiquement des issues GitHub
```

---

## 📊 Monitoring du Système CI

### Dashboard Recommandé

Via les routes admin, vous pouvez builder un dashboard:

```javascript
// Frontend - afficher la santé du système
const response = await fetch('/api/admin/ci/system-health', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const health = await response.json();

// Afficher un health score coloré
const statusColor = health.score >= 80 ? 'green' : 
                    health.score >= 50 ? 'yellow' : 'red';

console.log(`🎯 Health Score: ${health.score}% (${statusColor})`);
console.log(`📊 Requests: ${health.requestCount}`);
console.log(`❌ Error Rate: ${health.errorRate}%`);
console.log(`⏱️  Latency: ${health.avgLatency}ms`);
console.log(`🚨 Anomalies: ${health.anomaliesCount}`);
```

---

## 📝 Notes d'Implémentation

### Points Clés

1. **AutoFixer** exécute les fixes détectés → auto-recouvrement
2. **GitHubIntegration** crée des issues → traçabilité
3. **PredictiveAnalytics** anticipe → prévention proactive
4. **Routes admin** exposent tout → transparence et contrôle

### Prochaines Étapes (Phase 4)

- [ ] Intégration Prometheus pour les métriques
- [ ] Dashboard Grafana pour la visualisation
- [ ] Modèles ML avancés (Prophet, LSTM)
- [ ] Auto-génération de PRs avec fixes suggérés
- [ ] Escalade intelligente (chat, escalade humaine)
- [ ] Cost optimization suggestions
- [ ] Capacity planning automatique

---

## 🧪 Tests

```bash
# Tester une anomalie manuelle
curl -X POST http://localhost:5000/api/admin/ci/force-health-check \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Voir les prédictions
curl http://localhost:5000/api/admin/predictions \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Voir l'historique des auto-fixes
curl http://localhost:5000/api/admin/auto-fixes?limit=10 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Voir les issues GitHub créées
curl http://localhost:5000/api/admin/github-issues \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

---

## ✅ Checklist d'Activation

- [ ] GITHUB_TOKEN généré et configuré
- [ ] AUTO_FIXER_ENABLED=true
- [ ] PREDICTIVE_ANALYTICS_ENABLED=true
- [ ] Routes /api/admin testées
- [ ] Premier auto-fix executed et loggé
- [ ] Première issue GitHub créée
- [ ] Prédictions générées (toutes les heures)
- [ ] Dashboard admin consulté
- [ ] Alertes Slack reçues (si SLACK_WEBHOOK_URL configuré)

---

*Phases 2 & 3 complètent l'architecture d'amélioration continue pour un système quasi-autonome.*
