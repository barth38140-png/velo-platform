# 🚀 Guide de Démarrage Rapide - Phases 2 & 3

## ⏱️ 5 Minute Setup

### 1. Générer un GitHub Token (2 min)

```bash
# 1. Aller à https://github.com/settings/tokens
# 2. Cliquer "Generate new token (classic)"
# 3. Donner les permissions:
#    ✅ repo (full control)
#    ✅ read:org
# 4. Copier le token
```

### 2. Configurer le .env (2 min)

```bash
cd backend

# Ajouter les variables
cat >> .env << EOF

# Phase 2: Auto-Fixes
AUTO_FIXER_ENABLED=true
AUTO_FIXER_DRY_RUN=false

# Phase 2: GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_OWNER=barth38140-png
GITHUB_REPO=velo-platform

# Phase 3: Prédictions ML
PREDICTIVE_ANALYTICS_ENABLED=true
EOF
```

### 3. Lancer le Serveur (1 min)

```bash
npm run dev
# OU
cd ..
.\start-dev.ps1
```

---

## 🧪 Test Immédiat

### Vérifier que tout fonctionne

```bash
# 1. Test health check (pas d'auth)
curl http://localhost:5000/api/metrics/health | jq .

# 2. Obtenir un token admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"..."}' | jq -r '.token')

# 3. Vérifier status CI
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/ci/status | jq .

# 4. Voir les auto-fixes
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/auto-fixes | jq .

# 5. Voir les prédictions
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/predictions | jq .
```

### Ou utiliser les scripts npm

```bash
cd backend

# Health
npm run metrics:health

# Admin status (avec token)
TOKEN=xxx npm run admin:status

# Admin routes
TOKEN=xxx npm run admin:auto-fixes
TOKEN=xxx npm run admin:predictions
TOKEN=xxx npm run admin:health
```

---

## 📊 Dashboard Rapide

### Health Score

```bash
curl -s http://localhost:5000/api/metrics/health | jq '.healthScore'
# Output: 82
```

### Anomalies Actuelles

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/ci/anomalies-detected | jq '.total'
# Output: 0 (bon signe!)
```

### Auto-Fixes Exécutés

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/auto-fixes | jq '.stats.successRate'
# Output: "80.00%"
```

### Issues GitHub Créées

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/github-issues | jq '.total'
# Output: 5
```

---

## 🎯 Modes de Fonctionnement

### Mode 1: DRY RUN (Simulation)

```bash
# Activer le mode test (ne rien modifie réellement)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/auto-fixes/dry-run

# Les fixes s'exécuteront mais loggent "[DRY RUN]"
```

### Mode 2: AUTO (Production)

```bash
# Activer les auto-fixes réels
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/auto-fixes/enable

# Les fixes s'exécuteront et modifieront le système
```

### Mode 3: DISABLED

```bash
# Désactiver les auto-fixes
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/auto-fixes/disable

# Les anomalies seront détectées mais pas corrigées
```

---

## 🔔 Activer les Notifications Slack

### 1. Créer un Webhook Slack

```
1. Aller à https://api.slack.com/apps
2. Créer une app "Velo Platform CI"
3. Activer "Incoming Webhooks"
4. Ajouter un webhook vers #alerts
5. Copier l'URL
```

### 2. Configurer le .env

```bash
echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL" >> backend/.env
```

### 3. Redémarrer le serveur

```bash
npm run dev
```

### 4. Tester

```bash
# Forcer une vérification (la notification Slack sera envoyée)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/ci/force-health-check
```

---

## 📈 Monitoring Continu

### Logs en Temps Réel

```bash
# Terminal 1: Lancer le serveur
npm run dev

# Terminal 2: Voir les logs (tail en direct)
tail -f backend/logs/*.log | grep -i "CI\|anomaly\|fix"

# Chercher des anomalies
grep "🚨 Anomalie" backend/logs/*.log

# Chercher des auto-fixes exécutés
grep "✅ Auto-fix" backend/logs/*.log
```

### Logs Structurés

```bash
# Tous les logs sont en JSON (Pino)
tail -f backend/logs/app.log | jq 'select(.message | contains("anomaly"))'

# Filtrer par niveau
tail -f backend/logs/app.log | jq 'select(.level == 50)' # Erreurs
tail -f backend/logs/app.log | jq 'select(.level == 40)' # Warnings
```

---

## 🐛 Troubleshooting

### Routes `/api/admin` non trouvées

```bash
# Vérifier que les imports sont corrects
grep "const adminRoutes" backend/src/index.js

# Vérifier que la route est montée
grep "/api/admin" backend/src/index.js

# Redémarrer le serveur
npm run dev
```

### Tokens GitHub invalides

```bash
# Vérifier le token
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user

# Vérifier que le token a les bonnes permissions
# (repo, read:org)

# Régénérer si nécessaire: https://github.com/settings/tokens
```

### Auto-Fixes ne s'exécutent pas

```bash
# Vérifier que AUTO_FIXER_ENABLED=true
grep AUTO_FIXER backend/.env

# Vérifier que DRY_RUN n'est pas actif
grep AUTO_FIXER_DRY_RUN backend/.env

# Forcer une vérification d'anomalies
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/ci/force-health-check
```

### Prédictions ne s'affichent pas

```bash
# Vérifier que PREDICTIVE_ANALYTICS_ENABLED=true
grep PREDICTIVE_ANALYTICS backend/.env

# Attendre 1h (prédictions générées toutes les heures)
# OU forcer une prédiction
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/predictions | jq .
```

---

## 📋 Checklist d'Activation

Phase 2 (Auto-Fixes & GitHub):
- [ ] GitHub token généré et configuré
- [ ] AUTO_FIXER_ENABLED=true
- [ ] GITHUB_TOKEN configuré
- [ ] Tester en DRY_RUN=true
- [ ] Tester route POST /api/admin/auto-fixes/enable
- [ ] Voir les issues GitHub créées

Phase 3 (Prédictions ML):
- [ ] PREDICTIVE_ANALYTICS_ENABLED=true
- [ ] Tester route GET /api/admin/predictions
- [ ] Vérifier les recommandations
- [ ] Laisser tourner 1-2 semaines pour data

Notifications:
- [ ] (Optionnel) SLACK_WEBHOOK_URL configuré
- [ ] (Optionnel) Tester alert Slack
- [ ] (Optionnel) Vérifier daily report

---

## 🎓 Prochaines Étapes

### Semaine 1: Stabilisation Phase 2-3

```
Day 1: Setup basique + test DRY RUN
Day 2-3: Activer AUTO_FIXER en prod
Day 4-5: Configurer GitHub Integration
Day 6-7: Valider anomalies et auto-fixes
```

### Semaine 2: Monitoring & Tuning

```
Day 8-9: Configurer Slack notifications
Day 10-12: Observer patterns d'anomalies
Day 13-14: Ajuster thresholds si nécessaire
```

### Semaine 3-4: Phase 4 (Optionnel)

```
Day 15-21: Implémenter modèles ML avancés
Day 22-28: Auto-génération PRs
```

---

## 💡 Bonnes Pratiques

### 1. Commencer par DRY RUN

```bash
# Toujours tester d'abord en simulation
AUTO_FIXER_DRY_RUN=true npm run dev

# Vérifier les logs "[DRY RUN]"
tail -f backend/logs/app.log | grep "DRY RUN"

# Activer en prod seulement après validation
```

### 2. Monitorer les Changements

```bash
# Vérifier l'historique des auto-fixes exécutés
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/auto-fixes?limit=50 | jq '.executionLog'

# Vérifier les issues GitHub créées
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/github-issues | jq '.recentIssues'
```

### 3. Escalader les Anomalies

```
LOW → Ignorer (système s'auto-corrige)
MEDIUM → Monitorer (peut devenir critique)
HIGH → Alerte Slack (demander attention)
CRITICAL → Issue GitHub + alerte (escalade rapide)
```

### 4. Réviser Régulièrement

```bash
# Chaque jour: vérifier la santé
curl http://localhost:5000/api/metrics/health | jq '.healthScore'

# Chaque semaine: réviser les prédictions
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/predictions | jq '.recommendations'

# Chaque mois: ajuster les thresholds
# (voir PHASES_2_3_IMPLEMENTATION.md pour tuning)
```

---

## 📞 Support

Pour des questions:
1. Lire `CONTINUOUS_IMPROVEMENT.md` (Phase 1)
2. Lire `PHASES_2_3_IMPLEMENTATION.md` (Phase 2-3)
3. Lire `CI_INTEGRATION_OVERVIEW.md` (Intégration totale)
4. Vérifier les logs: `tail -f backend/logs/app.log`
5. Tester manuellement les routes

---

**🎉 Vous êtes prêt à déployer un système d'amélioration continue quasi-autonome !**
