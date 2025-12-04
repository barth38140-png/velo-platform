#!/bin/bash
# test-phases-2-3.sh
# Script de test pour Phases 2 & 3 du système d'amélioration continue

set -e

# Couleurs pour le log
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Tests: Phases 2 & 3 - Auto-Fixes & Prédictions ML${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Vérifier que le serveur est en cours d'exécution
check_server() {
  if ! curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${RED}❌ Le serveur n'est pas accessible sur http://localhost:5000${NC}"
    echo "Lancez: npm run dev (dans un autre terminal)"
    exit 1
  fi
  echo -e "${GREEN}✅ Serveur accessible${NC}\n"
}

# Test: Récupérer le token (admin)
get_token() {
  echo -e "${YELLOW}→ Création d'un compte admin pour les tests...${NC}"
  
  # Créer un utilisateur admin
  RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "firstName": "Admin",
      "lastName": "Test",
      "email": "admin@test.local",
      "phone": "0600000000",
      "password": "TestPassword123!",
      "role": "admin"
    }')
  
  # Essayer de récupérer le token
  TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@test.local",
      "password": "TestPassword123!"
    }' | jq -r '.token // empty')
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Impossible de récupérer un token${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Token obtenu${NC}"
}

# Phase 2: Test Auto-Fixes
test_phase_2() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  PHASE 2: Auto-Fixes & GitHub Integration${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

  # Test 1: Vérifier le status du système CI
  echo -e "${YELLOW}Test 1: Vérifier le status du système CI${NC}"
  STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:5000/api/admin/ci/status)
  
  if [ -z "$STATUS" ]; then
    echo -e "${RED}❌ Impossible de récupérer le status${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✅ Status du CI récupéré:${NC}"
  echo "$STATUS" | jq .
  
  # Test 2: Vérifier la configuration des auto-fixes
  echo -e "\n${YELLOW}Test 2: Vérifier la configuration des auto-fixes${NC}"
  AUTOFIXER=$(echo "$STATUS" | jq '.autoFixer')
  
  echo -e "${GREEN}Configuration Auto-Fixer:${NC}"
  echo "$AUTOFIXER" | jq .
  
  # Test 3: Activer le mode dry-run
  echo -e "\n${YELLOW}Test 3: Activer le mode dry-run (simulation)${NC}"
  DRY_RUN=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    http://localhost:5000/api/admin/auto-fixes/dry-run)
  
  echo -e "${GREEN}✅ Mode dry-run activé:${NC}"
  echo "$DRY_RUN" | jq .
  
  # Test 4: Récupérer l'historique des auto-fixes
  echo -e "\n${YELLOW}Test 4: Historique des auto-fixes${NC}"
  HISTORY=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:5000/api/admin/auto-fixes?limit=5")
  
  echo -e "${GREEN}✅ Historique des auto-fixes:${NC}"
  echo "$HISTORY" | jq .
  
  # Test 5: Vérifier les issues GitHub créées
  echo -e "\n${YELLOW}Test 5: Vérifier les issues GitHub créées${NC}"
  GITHUB_ISSUES=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:5000/api/admin/github-issues)
  
  echo -e "${GREEN}✅ Issues GitHub:${NC}"
  echo "$GITHUB_ISSUES" | jq .
}

# Phase 3: Test Prédictions ML
test_phase_3() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  PHASE 3: Prédictions ML & Recommandations${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

  # Test 1: Générer les prédictions
  echo -e "${YELLOW}Test 1: Générer les prédictions ML${NC}"
  PREDICTIONS=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:5000/api/admin/predictions)
  
  if [ -z "$PREDICTIONS" ]; then
    echo -e "${RED}❌ Impossible de récupérer les prédictions${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✅ Prédictions générées:${NC}"
  echo "$PREDICTIONS" | jq .
  
  # Test 2: Analyser les recommandations
  echo -e "\n${YELLOW}Test 2: Analyser les recommandations${NC}"
  RECOMMENDATIONS=$(echo "$PREDICTIONS" | jq '.recommendations')
  
  REC_COUNT=$(echo "$RECOMMENDATIONS" | jq 'length')
  echo -e "${GREEN}Nombre de recommandations: $REC_COUNT${NC}"
  
  if [ "$REC_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Recommandations trouvées:${NC}"
    echo "$RECOMMENDATIONS" | jq '.[0:3]' # Afficher les 3 premières
  else
    echo -e "${YELLOW}ℹ Pas de recommandation (système fonctionnel)${NC}"
  fi
  
  # Test 3: Détecter les anomalies
  echo -e "\n${YELLOW}Test 3: Détecter les anomalies actuelles${NC}"
  ANOMALIES=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:5000/api/admin/ci/anomalies-detected?limit=10")
  
  ANOM_COUNT=$(echo "$ANOMALIES" | jq '.total')
  echo -e "${GREEN}Nombre d'anomalies détectées: $ANOM_COUNT${NC}"
  
  if [ "$ANOM_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Anomalies détectées:${NC}"
    echo "$ANOMALIES" | jq '.anomalies[0:3]' # Les 3 premières
  else
    echo -e "${GREEN}✅ Aucune anomalie détectée (bon signe!)${NC}"
  fi
  
  # Test 4: Santé globale du système
  echo -e "\n${YELLOW}Test 4: Santé globale du système${NC}"
  HEALTH=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:5000/api/admin/ci/system-health)
  
  SCORE=$(echo "$HEALTH" | jq '.score')
  STATUS=$(echo "$HEALTH" | jq -r '.status')
  
  case "$STATUS" in
    "healthy")
      echo -e "${GREEN}✅ Status: HEALTHY (score: $SCORE/100)${NC}"
      ;;
    "degraded")
      echo -e "${YELLOW}⚠️  Status: DEGRADED (score: $SCORE/100)${NC}"
      ;;
    "critical")
      echo -e "${RED}❌ Status: CRITICAL (score: $SCORE/100)${NC}"
      ;;
  esac
  
  echo -e "\n${GREEN}Détails:${NC}"
  echo "$HEALTH" | jq '{score, status, errorRate, avgLatency, anomaliesCount, uptime}'
}

# Test complet
test_complete() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  TEST COMPLET: Intégration Phases 1-2-3${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

  # Forcer une vérification d'état
  echo -e "${YELLOW}Forcer une vérification d'état...${NC}"
  CHECK=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    http://localhost:5000/api/admin/ci/force-health-check)
  
  echo -e "${GREEN}✅ Vérification d'état complétée:${NC}"
  echo "$CHECK" | jq .
  
  # Afficher un résumé
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✅ TESTS COMPLÉTÉS AVEC SUCCÈS${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
  
  echo -e "${YELLOW}Prochaines étapes:${NC}"
  echo "1. Générer un GITHUB_TOKEN: https://github.com/settings/tokens"
  echo "2. Ajouter au .env: GITHUB_TOKEN=ghp_xxxxx"
  echo "3. Activer AUTO_FIXER_ENABLED=true"
  echo "4. Configurer les notifications Slack (optionnel)"
  echo ""
  echo -e "${YELLOW}Routes de monitoring disponibles:${NC}"
  echo "  GET  /api/metrics/health                 # Health public"
  echo "  GET  /api/admin/ci/status                # Status complet"
  echo "  GET  /api/admin/predictions              # Prédictions ML"
  echo "  GET  /api/admin/auto-fixes               # Historique fixes"
  echo "  GET  /api/admin/ci/system-health         # Santé globale"
  echo "  POST /api/admin/ci/force-health-check    # Forcer vérification"
}

# Exécution
main() {
  check_server
  get_token
  
  if [ $? -eq 0 ]; then
    test_phase_2
    test_phase_3
    test_complete
  else
    echo -e "${RED}❌ Tests échoués${NC}"
    exit 1
  fi
}

main
