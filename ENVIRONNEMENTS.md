# Gestion des environnements (dev/test) – velo-platform

## Backend

- **Développement**
  - Fichier : `backend/.env`
  - Port : `5000`
  - Base : `velo_platform`
  - Usage : `npm run dev` ou `npm start`

- **Test**
  - Fichier : `backend/.env.test`
  - Port : `3010`
  - Base : `velo_platform_test`
  - Usage : `NODE_ENV=test npm test` ou tout script de test

> Le backend choisit le fichier d'env selon la variable `NODE_ENV`.

## Frontend

- **Développement**
  - Proxy Vite : `/api` → `http://localhost:5000`
  - Lancement : `npm run dev`

- **Test (Cypress, E2E)**
  - Fichier : `frontend/.env.test`
  - Variable : `VITE_API_URL=http://localhost:3010/api`
  - Lancement : `npm run dev:test` puis Cypress

## Bonnes pratiques

- Toujours vérifier le port utilisé par chaque service.
- Pour les tests, s'assurer que le backend tourne sur 3010 et la base `velo_platform_test`.
- Nettoyer les fichiers `.env` pour éviter les doublons.
- Documenter toute modification d'environnement.

---


---

## Outils complémentaires

### Docker

- Utilisé principalement pour la base de données PostgreSQL (voir `docker-compose.yml`).
- Pour lancer la base en local :
  - `docker-compose up -d`
- Vérifier que les ports ne sont pas en conflit avec d'autres services locaux.
- Les variables d'environnement `.env` doivent correspondre à la configuration du conteneur (host, port, user, password, db).

### Cypress (tests E2E)

- Localisation des specs : `frontend/cypress/e2e/`
- Lancement en mode interactif : `npm run e2e:open` (ouvre l'UI Cypress)
- Lancement en mode headless : `npm run e2e:run`
- S'assurer que le frontend (`npm run dev:test`) et le backend (port 3010) sont démarrés avant d'exécuter Cypress.
- Les URLs d'API doivent pointer vers le backend de test (`VITE_API_URL`).

### ESLint

- Présent dans le frontend et le backend.
- Lancer l'analyse : `npm run lint` (dans chaque dossier)
- Permet de garantir la qualité et la cohérence du code.
- Les règles sont configurées dans `eslint.config.js` ou `eslint.config.mjs`.

---


---

## Intégration Continue (CI)

Un workflow GitHub Actions automatise les vérifications suivantes à chaque push ou pull request sur la branche `main` :

- Installation des dépendances backend et frontend
- Lancement d'un service PostgreSQL (base de test isolée)
- Exécution des migrations/seed pour préparer la base
- Tests backend (avec la base de test)
- Lint du frontend (qualité du code)
- Tests unitaires frontend
- Build du frontend (vérifie que l'app compile)
- Lancement du frontend en mode test et exécution des tests E2E Cypress (simulation d'un vrai utilisateur)

Si un test échoue, le merge est bloqué et l'erreur est affichée dans l'interface GitHub.

Le fichier de configuration se trouve dans `.github/workflows/ci.yml`.

---

*Dernière mise à jour : 20/11/2025*