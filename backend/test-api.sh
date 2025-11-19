#!/usr/bin/env bash
# Fichier de test des endpoints API Vélo Platform
# Ces commandes curl peuvent être copiées et exécutées individuellement
# Adaptation: remplacez les tokens et IDs par vos valeurs

BASE_URL="http://localhost:5000/api"

echo "==================================="
echo "🧪 Test API Vélo Platform"
echo "==================================="
echo ""

# 1. Vérifier que le serveur est actif
echo "1️⃣ Vérifier la santé du serveur..."
curl -s -X GET "$BASE_URL/../health" | jq .
echo ""

# 2. Inscription d'un client
echo "2️⃣ Créer un compte client..."
CLIENT_EMAIL="client_$(date +%s)@example.com"
CLIENT_RESPONSE=$(curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$CLIENT_EMAIL\",
    \"password\": \"SecurePassword123!\",
    \"name\": \"Jean Dupont\",
    \"phone\": \"+33612345678\",
    \"role\": \"client\"
  }")
echo "$CLIENT_RESPONSE" | jq .
CLIENT_TOKEN=$(echo "$CLIENT_RESPONSE" | jq -r '.token')
CLIENT_ID=$(echo "$CLIENT_RESPONSE" | jq -r '.user.id')
echo "→ Token client: $CLIENT_TOKEN"
echo "→ ID client: $CLIENT_ID"
echo ""

# 3. Inscription d'un réparateur
echo "3️⃣ Créer un compte réparateur..."
REPAIRER_EMAIL="repairer_$(date +%s)@example.com"
REPAIRER_RESPONSE=$(curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$REPAIRER_EMAIL\",
    \"password\": \"SecurePassword123!\",
    \"name\": \"Pierre Réparateur\",
    \"phone\": \"+33687654321\",
    \"role\": \"repairer\"
  }")
echo "$REPAIRER_RESPONSE" | jq .
REPAIRER_TOKEN=$(echo "$REPAIRER_RESPONSE" | jq -r '.token')
REPAIRER_ID=$(echo "$REPAIRER_RESPONSE" | jq -r '.user.id')
echo "→ Token réparateur: $REPAIRER_TOKEN"
echo "→ ID réparateur: $REPAIRER_ID"
echo ""

# 4. Créer un profil réparateur
echo "4️⃣ Créer un profil réparateur..."
curl -s -X POST "$BASE_URL/repairers/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REPAIRER_TOKEN" \
  -d '{
    "skills": "Freins, Chaîne, Pneus, Changement de vitesses",
    "bio": "Réparation de vélos depuis 10 ans avec expertise mécanique complète",
    "service_radius_km": 15,
    "is_available": true
  }' | jq .
echo ""

# 5. Mettre à jour la localisation du réparateur (Paris)
echo "5️⃣ Mettre à jour la position du réparateur..."
curl -s -X POST "$BASE_URL/locations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REPAIRER_TOKEN" \
  -d '{
    "latitude": 48.8566,
    "longitude": 2.3522,
    "address": "75001 Paris, France"
  }' | jq .
echo ""

# 6. Mettre à jour la localisation du client (près de Paris)
echo "6️⃣ Mettre à jour la position du client..."
curl -s -X POST "$BASE_URL/locations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{
    "latitude": 48.8566,
    "longitude": 2.3522,
    "address": "Paris, France"
  }' | jq .
echo ""

# 7. Créer une demande de réparation
echo "7️⃣ Créer une demande de réparation..."
REPAIR_RESPONSE=$(curl -s -X POST "$BASE_URL/repairs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{
    "title": "Crevaison du pneu avant",
    "description": "Mon pneu avant est crevé et j'"'"'ai besoin d'"'"'une réparation rapide",
    "bike_type": "VTT",
    "location_lat": 48.8566,
    "location_lng": 2.3522,
    "location_address": "Paris, France"
  }')
echo "$REPAIR_RESPONSE" | jq .
REPAIR_ID=$(echo "$REPAIR_RESPONSE" | jq -r '.repair.id')
echo "→ ID demande: $REPAIR_ID"
echo ""

# 8. Récupérer les demandes en attente (pour le réparateur)
echo "8️⃣ Récupérer les demandes en attente..."
curl -s -X GET "$BASE_URL/repairs/pending-requests" \
  -H "Authorization: Bearer $REPAIRER_TOKEN" | jq .
echo ""

# 9. Rechercher les réparateurs proches
echo "9️⃣ Rechercher réparateurs proches (rayon 10km)..."
curl -s -X GET "$BASE_URL/locations/nearby-repairers?latitude=48.8566&longitude=2.3522&radius_km=10" | jq .
echo ""

# 10. Envoyer un message du réparateur au client
echo "🔟 Envoyer une offre de réparation..."
MESSAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REPAIRER_TOKEN" \
  -d "{
    \"receiver_id\": $CLIENT_ID,
    \"content\": \"Bonjour, je peux réparer votre crevaison pour 30€. Je peux venir demain à 14h.\",
    \"repair_request_id\": $REPAIR_ID
  }")
echo "$MESSAGE_RESPONSE" | jq .
echo ""

# 11. Récupérer les conversations
echo "1️⃣1️⃣ Récupérer mes conversations..."
curl -s -X GET "$BASE_URL/messages/conversations" \
  -H "Authorization: Bearer $CLIENT_TOKEN" | jq .
echo ""

# 12. Récupérer une conversation spécifique
echo "1️⃣2️⃣ Récupérer la conversation avec le réparateur..."
curl -s -X GET "$BASE_URL/messages/$REPAIRER_ID" \
  -H "Authorization: Bearer $CLIENT_TOKEN" | jq .
echo ""

# 13. Mettre à jour le statut de la demande
echo "1️⃣3️⃣ Accepter la demande (passer en 'assigned')..."
curl -s -X PATCH "$BASE_URL/repairs/$REPAIR_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{
    "status": "assigned"
  }' | jq .
echo ""

# 14. Récupérer le profil
echo "1️⃣4️⃣ Récupérer mon profil..."
curl -s -X GET "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $CLIENT_TOKEN" | jq .
echo ""

# 15. Récupérer le profil d'un réparateur
echo "1️⃣5️⃣ Récupérer le profil du réparateur..."
curl -s -X GET "$BASE_URL/repairers/$REPAIRER_ID" \
  -H "Authorization: Bearer $CLIENT_TOKEN" | jq .
echo ""

echo "==================================="
echo "✅ Tests complétés!"
echo "==================================="
