# 🚲 Vélo Platform

Une plateforme web complète reliant les **clients ayant besoin de réparations de vélos** avec les **réparateurs professionnels**.

## 🎯 Objectif

Offrir une expérience utilisateur fluide pour :
- **Clients** : Créer une demande, trouver un réparateur, communiquer et payer
- **Réparateurs** : Voir les demandes proches, faire des offres, gérer le planning
- **Administrateurs** : Gérer les utilisateurs, les statuts, les paiements (future)

---

## 📦 Architecture

```
velo-platform/
├── backend/                    # 🔧 API REST (Node.js + PostgreSQL)
│   ├── config/                 # Configuration (BD, env)
│   ├── controllers/            # Logique métier
│   ├── models/                 # Requêtes BD
│   ├── routes/                 # Endpoints
│   ├── middlewares/            # Auth, validation
│   ├── sql/                    # Scripts SQL
│   ├── index.js                # Point d'entrée
│   ├── package.json
│   ├── .env.example
│   ├── API_DOCUMENTATION.md    # Documentation API complète
│   ├── IMPROVEMENTS_SUMMARY.md # Résumé des améliorations
│   └── init-db.ps1             # Script d'initialisation BD
│
└── frontend/                   # 🎨 Interface React (à créer)
    ├── src/
    ├── pages/
    ├── components/
    └── App.jsx
```

---

## 🚀 Démarrage rapide

### Prérequis
- **Node.js** 16+ ([télécharger](https://nodejs.org))
- **PostgreSQL** 12+ ([télécharger](https://www.postgresql.org/download))
- **Git** ([télécharger](https://git-scm.com))

### Installation du Backend

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd velo-platform

# 2. Configurer les variables d'environnement
cd backend
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL

# 3. Initialiser la base de données
# Windows
.\init-db.ps1

# Linux/Mac
bash init-db.sh

# 4. Installer les dépendances
npm install

# 5. Démarrer le serveur
npm run dev  # Mode développement
# ou
npm start    # Mode production
```

Le serveur écoute sur **http://localhost:5000**

### Test de l'API

```bash
# Tester les endpoints
cd backend

# Windows
.\test-api.ps1

# Linux/Mac
bash test-api.sh
```

---

## 📚 Documentation

### Backend
- **[API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)** : Endpoints, exemples, authentification
- **[IMPROVEMENTS_SUMMARY.md](./backend/IMPROVEMENTS_SUMMARY.md)** : Détail des améliorations
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** : Solutions aux problèmes courants

### Frontend
- À venir lors de la création du projet React

---

## 🔌 Endpoints Principaux

### Authentification
```bash
POST /api/users/register      # Créer un compte
POST /api/users/login         # Se connecter
```

### Demandes de Réparation
```bash
POST /api/repairs             # Créer une demande
GET /api/repairs              # Mes demandes
GET /api/repairs/pending-requests  # Demandes disponibles (réparateur)
```

### Réparateurs
```bash
GET /api/repairers/all        # Lister tous les réparateurs
GET /api/repairers/:userId    # Profil d'un réparateur
POST /api/repairers/profile   # Créer/mettre à jour mon profil
```

### Géolocalisation
```bash
POST /api/locations           # Mettre à jour ma position
GET /api/locations/nearby-repairers  # Trouver réparateurs proches
```

### Messagerie
```bash
POST /api/messages            # Envoyer un message
GET /api/messages/conversations  # Mes conversations
```

---

## 💻 Stack Technologique

### Backend
| Composant | Tech |
|-----------|------|
| **Serveur** | Node.js + Express |
| **Base de données** | PostgreSQL 12+ |
| **Authentification** | JWT + bcrypt |
| **Géolocalisation** | Formule de Haversine |
| **Validation** | Express-validator (optionnel) |

### Frontend (à créer)
| Composant | Tech |
|-----------|------|
| **Framework** | React 18+ |
| **Bundler** | Vite |
| **Routeur** | React Router |
| **État** | Context API / Zustand |
| **Requêtes HTTP** | Axios |
| **Carte** | Leaflet / Mapbox |
| **Chat** | Socket.io (optionnel) |
| **Styling** | Tailwind CSS |

---

## 🔐 Sécurité

✅ **Implémenté**
- JWT tokens avec expiration (7 jours)
- Hachage bcrypt des mots de passe (10 rounds)
- Vérification CORS
- Requêtes paramétrées (SQL injection prevention)
- Middleware d'authentification

⚠️ **À faire avant production**
- Changer JWT_SECRET et DB_PASSWORD
- Restreindre CORS à domaines spécifiques
- Activer HTTPS/TLS
- Ajouter rate limiting
- Ajouter logging/monitoring
- Configurer les backups BD
- Ajouter validation des inputs (joi)

---

## 📊 Flux de Travail Utilisateur

### Pour un CLIENT

```
1. Inscription → Créer compte
2. Login → Obtenir JWT
3. Créer demande → Ajouter localisation, description
4. Consulter offres → Réparateurs proposent prix
5. Accepter offre → Confirmer réparation
6. Chatter → Communication avec réparateur
7. Payer → (optionnel, à implémenter)
```

### Pour un RÉPARATEUR

```
1. Inscription → Créer compte (role: repairer)
2. Compléter profil → Compétences, photos, zone
3. Activer disponibilité → On/Off selon planning
4. Voir demandes proches → Filtrer par distance
5. Envoyer offre → Proposer prix et durée
6. Attendre acceptation → Chat en attente
7. Effectuer réparation → Marquer en cours → Complétée
```

---

## 🧪 Tests

### Tests de l'API
```bash
cd backend

# Script de test (Windows)
.\test-api.ps1

# Script de test (Linux/Mac)
bash test-api.sh
```

### Tests unitaires (à implémenter)
```bash
npm test
```

---

## 🐳 Docker (Optionnel)

Pour faciliter le déploiement, un `docker-compose.yml` inclut PostgreSQL :

```bash
# Démarrer PostgreSQL dans Docker
docker-compose up -d

# Arrêter
docker-compose down
```

---

## 📱 Prochaines Étapes

### Phase 1 : Frontend React
- [ ] Pages d'authentification (login/register)
- [ ] Dashboard client (créer demande, voir réparateurs)
- [ ] Dashboard réparateur (voir demandes, faire offres)
- [ ] Profils utilisateurs
- [ ] Carte (Leaflet)

### Phase 2 : Fonctionnalités avancées
- [ ] Système de paiement (Stripe/PayPal)
- [ ] Chat temps réel (Socket.io)
- [ ] Système de rating/avis
- [ ] Planning des réparations
- [ ] Notifications (Email, SMS, Push)

### Phase 3 : Admin
- [ ] Dashboard d'administration
- [ ] Gestion des utilisateurs
- [ ] Statistiques et rapports
- [ ] Système de support/modération

---

## 🤝 Contribution

Les contributions sont bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 👥 Auteurs

- **Développement Backend** : Implémentation complète avec authentification, géolocalisation, messagerie
- **Spécification** : Plateforme de mise en relation réparateurs-clients

---

## 📞 Support

Pour toute question ou problème :

1. Consultez [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Vérifiez [API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)
3. Ouvrez une issue GitHub

---

## 🎉 Status du Projet

| Composant | Status | Notes |
|-----------|--------|-------|
| Backend API | ✅ Complète | Prêt pour le frontend |
| Authentification | ✅ Complète | JWT + bcrypt |
| Géolocalisation | ✅ Complète | Haversine formula |
| Messagerie | ✅ Complète | Support conversations |
| Base de données | ✅ Optimisée | Avec 10 indexes |
| Documentation | ✅ Complète | 50+ exemples |
| Frontend React | ⏳ À commencer | Prochaine phase |
| Paiements | ⏳ Non implémenté | Phase 2 |
| Chat temps réel | ⏳ Non implémenté | Phase 2 |

---

**Dernière mise à jour** : 15 novembre 2025  
**Version** : 1.0.0

Prêt pour la création du frontend React ! 🎨🚀
