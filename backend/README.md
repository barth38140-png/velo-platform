# 📦 Backend Velo Platform

Ce dossier contient l'API Node.js Express, la logique métier, la gestion des utilisateurs, des vélos et des réparations.

## 🚀 Démarrage rapide

```bash
npm install
npm run dev
```

## 🗄️ Structure
- `controllers/` : logiques des routes
- `models/` : accès aux données
- `routes/` : endpoints API
- `middlewares/` : validation, auth, gestion erreurs
- `config/` : configuration DB, logger
- `sql/` : migrations PostgreSQL

## 🔒 Sécurité
- Authentification JWT
- Validation des entrées
- Logger Pino
- Requêtes SQL paramétrées

## 🧪 Tests
- Jest pour les tests unitaires
- Couverture dans `coverage/`

## 📖 Documentation
- Voir le README.md racine pour les règles globales
- Ce fichier doit être enrichi à chaque évolution technique
