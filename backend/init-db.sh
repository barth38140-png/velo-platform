#!/bin/bash
# Script pour initialiser la base de données Vélo Platform
# Utilisation: ./init-db.sh

set -e

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo -e "${RED}❌ Fichier .env non trouvé!${NC}"
    echo "   Créez-le en copiant .env.example:"
    echo "   cp .env.example .env"
    exit 1
fi

# Récupérer les variables d'environnement
set -a
source .env
set +a

echo -e "${YELLOW}🔄 Initialisation de la base de données Vélo Platform...${NC}"

# Créer la base de données si elle n'existe pas
echo -e "${YELLOW}📊 Création de la base de données '${DB_NAME}'...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -U $DB_USER $DB_NAME

echo -e "${YELLOW}📝 Exécution des scripts SQL...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f sql/init.sql

echo -e "${GREEN}✅ Base de données initialisée avec succès!${NC}"
echo ""
echo -e "${GREEN}🚀 Vous pouvez maintenant démarrer le serveur:${NC}"
echo "   npm run dev"
