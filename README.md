# 🚲 Velo Platform

Plateforme de gestion de vélos et de demandes de réparation, connectant clients et réparateurs.

## 📋 Fonctionnalités

- **Gestion de vélos** : ajout, modification, suivi des composants
- **Demandes de réparation** : création et gestion des demandes
- **Offres de réparation** : système de mise en relation clients/réparateurs
- **Authentification** : JWT avec rôles (client, réparateur, admin)
- **Géolocalisation** : carte interactive pour localiser les réparations

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
PORT=3010
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_NAME=velo_platform
JWT_SECRET=votre_secret_jwt
NODE_ENV=development
```

Initialiser la base de données :
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
VITE_API_URL=http://localhost:3010
```

## 🏃 Démarrage

### Mode développement

**Backend** (terminal 1) :
```bash
cd backend
npm run dev
```
→ API disponible sur http://localhost:3010

**Frontend** (terminal 2) :
```bash
cd frontend
npm run dev
```
→ Interface disponible sur http://localhost:5173

### Mode production avec Docker

```bash
docker-compose up -d
```

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

## 📁 Structure du projet

```
velo-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Logique métier
│   │   ├── routes/         # Routes API
│   │   ├── middlewares/    # Auth, validation
│   │   ├── models/         # Accès base de données
│   │   ├── logger.js       # Configuration Pino
│   │   └── index.js        # Point d'entrée
│   ├── tests/              # Tests Jest
│   ├── sql/                # Migrations SQL
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── context/        # Context API (Auth, Toast)
│   │   ├── services/       # API calls
│   │   ├── styles/         # CSS
│   │   └── App.jsx         # Point d'entrée
│   ├── cypress/            # Tests E2E
│   └── package.json
└── docker-compose.yml
```

## 🔌 API Endpoints

### Authentification
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion

### Vélos
- `GET /bikes` - Liste des vélos
- `POST /bikes` - Créer un vélo
- `PUT /bikes/:id` - Modifier un vélo
- `DELETE /bikes/:id` - Supprimer un vélo

### Réparations
- `GET /repairs` - Liste des demandes
- `POST /repairs` - Créer une demande
- `GET /repairs/:id/offers` - Offres pour une demande

### Offres
- `POST /repairs/:id/offers` - Créer une offre
- `PUT /offers/:id/accept` - Accepter une offre

Documentation complète : voir `/backend/docs` (à venir)

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

## 📝 Licence

MIT

## 👥 Auteurs

- **Barth38140** - [GitHub](https://github.com/barth38140-png)

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contact : [votre-email@example.com]
