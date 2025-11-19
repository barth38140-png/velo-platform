# 🚲 Vélo Platform — Backend API

API REST pour une plateforme de mise en relation entre clients ayant besoin de réparations de vélos et réparateurs professionnels.

## 📦 Technologies

- **Node.js + Express** : Serveur web
- **PostgreSQL** : Base de données
- **JWT + bcrypt** : Authentification et sécurité
- **CORS** : Gestion des requêtes cross-origin
- **dotenv** : Configuration d'environnement

## 🚀 Installation rapide

### Prérequis
- Node.js 16+
- PostgreSQL 12+
- npm ou yarn

### Étapes

1. **Installer les dépendances** :
```bash
npm install
```

2. **Configurer les variables d'environnement** :
```bash
cp .env.example .env
# Éditer .env avec vos identifiants PostgreSQL
```

3. **Initialiser la base de données** :
```bash
psql -U postgres -h localhost -d velo_platform -f sql/init.sql
```

4. **Démarrer le serveur** :
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

Le serveur écoute sur `http://localhost:5000`

---

## 🔌 Endpoints API

### 📋 Santé du serveur

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/health` | ❌ | Vérifier que le serveur tourne |
| GET | `/api/ping` | ❌ | Ping simple |
| GET | `/test-db` | ❌ | Tester la connexion BD |

### 👤 Authentification & Utilisateurs

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/users/register` | ❌ | Créer un compte (client ou réparateur) |
| POST | `/api/users/login` | ❌ | Se connecter et obtenir un JWT |
| GET | `/api/users` | ❌ | Lister les utilisateurs (limité à 50) |
| GET | `/api/users/profile` | ✅ | Récupérer le profil de l'utilisateur connecté |

#### Exemple : Inscription
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "secure_password",
    "name": "Jean Dupont",
    "phone": "+33612345678",
    "role": "client"
  }'
```

**Réponse** :
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "client@example.com",
    "name": "Jean Dupont",
    "phone": "+33612345678",
    "role": "client"
  }
}
```

#### Exemple : Connexion
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "secure_password"
  }'
```

---

### 🔧 Demandes de Réparation

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/repairs` | ✅ | Créer une demande (client) |
| GET | `/api/repairs` | ✅ | Lister mes demandes (client) |
| GET | `/api/repairs/detail/:requestId` | ✅ | Détails d'une demande |
| PATCH | `/api/repairs/:requestId/status` | ✅ | Mettre à jour le statut |
| GET | `/api/repairs/pending-requests` | ✅ | Lister demandes en attente (réparateur) |

#### Exemple : Créer une demande
```bash
curl -X POST http://localhost:5000/api/repairs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Crevaison",
    "description": "Pneu crevé avant",
    "bike_type": "VTT",
    "location_lat": 48.8566,
    "location_lng": 2.3522,
    "location_address": "Paris, France"
  }'
```

**Statuts possibles** : `pending`, `assigned`, `in_progress`, `completed`, `cancelled`

---

### 💬 Messagerie

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/messages` | ✅ | Envoyer un message |
| GET | `/api/messages/conversations` | ✅ | Lister mes conversations |
| GET | `/api/messages/:userId` | ✅ | Conversation avec un utilisateur |

#### Exemple : Envoyer un message
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "receiver_id": 2,
    "content": "Bonjour, êtes-vous disponible pour réparer mon vélo?",
    "repair_request_id": 5
  }'
```

---

### 📍 Géolocalisation

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/locations` | ✅ | Mettre à jour ma position |
| GET | `/api/locations` | ✅ | Récupérer ma position |
| GET | `/api/locations/nearby-repairers` | ❌ | Chercher réparateurs proches |

#### Exemple : Mettre à jour la localisation
```bash
curl -X POST http://localhost:5000/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "latitude": 48.8566,
    "longitude": 2.3522,
    "address": "75001 Paris, France"
  }'
```

#### Exemple : Trouver réparateurs proches
```bash
curl "http://localhost:5000/api/locations/nearby-repairers?latitude=48.8566&longitude=2.3522&radius_km=10"
```

**Réponse** :
```json
{
  "success": true,
  "count": 3,
  "repairers": [
    {
      "id": 2,
      "name": "Jean Réparateur",
      "email": "jean@example.com",
      "skills": "Freins, Chaîne, Pneus",
      "rating": 4.8,
      "distance_km": 2.5
    }
  ]
}
```

---

## 🔐 Authentification

Tous les endpoints marqués avec ✅ nécessitent un token JWT.

**Format du header** :
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Durée de validité du token** : 7 jours

---

## 🗄️ Structure de la Base de Données

### Tables principales

- **users** : Utilisateurs (clients + réparateurs)
- **repairer_profiles** : Profils détaillés des réparateurs
- **repair_requests** : Demandes de réparation
- **repair_offers** : Offres de réparation (prix, durée)
- **messages** : Conversations entre utilisateurs
- **locations** : Géolocalisation en temps réel

### Indexes pour performance

- `idx_users_email` : Recherche rapide par email
- `idx_repair_requests_user_id` : Requêtes par utilisateur
- `idx_repair_requests_status` : Filtrage par statut
- `idx_repair_requests_location` : Recherche géographique
- `idx_locations_user_id` : Localisation rapide

---

## 📊 Flux de travail typique

### 1. Client crée une demande
```
1. POST /api/users/register (inscrit)
2. POST /api/users/login (récupère JWT)
3. POST /api/locations (met à jour position)
4. POST /api/repairs (crée demande)
```

### 2. Réparateur consulte demandes
```
1. POST /api/users/login (se connecte)
2. GET /api/repairs/pending-requests (voit demandes proches)
3. GET /api/locations/nearby-repairers (affiche carte)
```

### 3. Communication
```
1. POST /api/messages (réparateur envoie offre)
2. GET /api/messages/conversations (client voit offres)
3. PATCH /api/repairs/:id/status (client accepte)
4. POST /api/messages (échanges ultérieurs)
```

---

## ⚙️ Configuration

Voir `.env.example` pour toutes les variables d'environnement :

- `PORT` : Port du serveur (défaut: 5000)
- `DB_HOST` : Host PostgreSQL (défaut: localhost)
- `DB_PORT` : Port PostgreSQL (défaut: 5432)
- `DB_USER` : Utilisateur PostgreSQL
- `DB_PASSWORD` : Mot de passe PostgreSQL
- `DB_NAME` : Nom de la base de données
- `JWT_SECRET` : Clé secrète pour signer les tokens
- `SALT_ROUNDS` : Nombre de rounds bcrypt (défaut: 10)

---

## 🧪 Tests

```bash
# Lancer les tests
npm test
```

---

## 📝 Notes importantes

- Les mots de passe sont hachés avec **bcrypt** (10 rounds)
- Les tokens JWT expirent après **7 jours**
- La recherche de réparateurs utilise la **formule de Haversine** pour calculer les distances géographiques
- Les coordonnées GPS doivent être en **décimales** (latitude/longitude)

---

## 🐛 Dépannage

### Erreur de connexion BD
Vérifier que PostgreSQL est démarré et les identifiants dans `.env` sont corrects.

### JWT invalide
Assurez-vous que le token est passé correctement dans le header `Authorization: Bearer <token>`

### Réparateurs non trouvés
Vérifier que :
1. Les réparateurs ont mis à jour leur localisation
2. Leur profil est marqué comme disponible (`is_available = true`)

---

## 📞 Support

Pour toute question ou problème, veuillez consulter la documentation ou signaler un problème.

---

**Version** : 1.0.0  
**Licence** : MIT
