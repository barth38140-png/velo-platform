# 🖥️ Frontend Velo Platform

Ce dossier contient l'application React/Vite pour l'interface utilisateur.

## 🚀 Démarrage rapide

```bash
npm install
npm run dev
```

## 🗄️ Structure
- `src/` : composants React, hooks, context
- `styles/` : CSS pur
- `services/` : appels API (Axios)
- `cypress/` : tests E2E
- `test/` : tests unitaires (Vitest)

## 🗺️ Fonctionnalités
- Cartes interactives (Leaflet)
- Authentification JWT
- Socket.io pour temps réel
- Context API pour état global

## 🧪 Tests
- Vitest pour les tests unitaires
- Cypress pour les tests E2E

## 📖 Documentation
- Voir le README.md racine pour les règles globales
- Ce fichier doit être enrichi à chaque évolution technique

## 🛠️ Refactorisation décembre 2025

### Découpage et modularisation
- `src/components/FiltersPanel.jsx` : panneau de filtres premium, extrait de `Repairers.jsx`
- `src/components/Drawer.jsx` : composant drawer accessible
- `src/hooks/useRepairers.js` : hook personnalisé pour filtrage, pagination, favoris
- `src/hooks/useAutocomplete.js` : hook pour l'autocomplétion (noms, compétences)
- `styles/repairers.css` : styles centralisés pour les cartes, filtres et drawer

### Avantages
- Robustesse et évolutivité
- Meilleure lisibilité et testabilité
- Réutilisation facilitée

### Points d'entrée
- Page principale : `src/pages/Repairers.jsx` (utilise les nouveaux composants/hooks)
- Pour ajouter un filtre ou une logique métier, modifiez le hook ou le composant dédié

### À faire
- Compléter l'extraction du JSX dans les nouveaux fichiers
- Ajouter des tests unitaires pour chaque composant/hook
- Mettre à jour la documentation à chaque évolution

---
*Refonte réalisée avec GitHub Copilot, validée le 08/12/2025.*
