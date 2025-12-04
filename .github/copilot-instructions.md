# Instructions pour GitHub Copilot

## Règle de documentation IA
- Toute suggestion, documentation ou prompt généré par un agent IA doit être intégré dans le README.md principal (racine) ou dans le README.md du dossier concerné.
- Il est interdit de créer ou enrichir d'autres fichiers .md.
- Le README.md central fait office de journal de bord et de référence unique.

## Langue
- **Toujours communiquer en français** pour les réponses, commentaires et explications
- Utiliser le français pour la documentation et les messages de commit

## Style de code JavaScript/Node.js

### Conventions générales
- Utiliser **camelCase** pour les variables et fonctions
- Utiliser **PascalCase** pour les composants React et les classes
- **Backend**: utiliser `async function nomFonction()` pour les controllers/routes
- **Frontend**: privilégier les **arrow functions** pour les composants React
- Utiliser **async/await** plutôt que `.then()` pour les promesses
- Backend en **CommonJS** (`require`/`module.exports`), Frontend en **ESM** (`import`/`export`)
- Toujours inclure des **commentaires en français** pour la logique complexe

### Gestion des erreurs
- Utiliser des blocs **try/catch** systématiquement pour le code asynchrone
- Retourner des codes HTTP appropriés (200, 201, 400, 401, 403, 404, 500)
- **TOUJOURS** utiliser le logger Pino (`logger.error()`, `logger.info()`, `logger.debug()`)
- **JAMAIS** utiliser `console.log()` ou `fs.appendFileSync()` directement
- Messages d'erreur en **anglais** pour les logs techniques, en **français** pour les réponses API
- Format d'erreur API: `{ error: "Message en français pour l'utilisateur" }`

### Backend (Express/Node.js)
- Valider les entrées avec les middlewares dans `middlewares/validators.js`
- Utiliser les middlewares d'authentification (`auth.js`, `isAdmin.js`) pour les routes protégées
- Structurer les routes selon le pattern: Route → Controller → Model → DB
- Toujours utiliser des requêtes SQL paramétrées pour éviter les injections SQL
- Gérer correctement les transactions PostgreSQL quand nécessaire
- Utiliser `pool.query()` depuis `config/db.js` pour les requêtes DB
### Frontend (React/Vite)
- Utiliser des **hooks React** (useState, useEffect, useContext, useNavigate)
- Séparer la logique métier des composants d'affichage
- Gérer l'état global avec **Context API** (`context/AuthContext.jsx`)
- **CSS pur** dans le dossier `styles/`, pas de Tailwind
- Utiliser **Leaflet** pour les cartes (`react-leaflet`)
- Axios pour les appels API depuis `services/api.js`
- Socket.io pour les communications temps réel
- Tests avec **Vitest** et **@testing-library/react**
- Tests E2E avec **Cypress**
- Séparer la logique métier des composants d'affichage
- Gérer l'état global avec Context API si nécessaire
- Utiliser Tailwind CSS pour le styling
- Implémenter la gestion d'erreur dans les composants avec error boundaries si approprié

## Tests

### Principes
- **Toujours créer des tests** pour les nouvelles fonctionnalités
- Utiliser **Jest** pour le backend et **Vitest** pour le frontend
- Viser une couverture de code d'au moins 80%
- Nommer les tests de façon descriptive en français

### Structure des tests
- Backend: placer les tests dans `backend/tests/`
- Frontend: placer les tests à côté des composants ou dans `frontend/test/`
- Tests unitaires: `.unit.test.js`
- Tests d'intégration: `.test.js`
- Tests E2E: Cypress dans `frontend/cypress/`

## Base de données

### PostgreSQL
- Utiliser le pool de connexions défini dans `backend/config/db.js`
- Créer des migrations SQL dans `backend/sql/` avec numérotation séquentielle
- Toujours nettoyer les ressources (fermer les connexions) après utilisation
- Utiliser des transactions pour les opérations multiples liées

## Sécurité

### Bonnes pratiques
- Ne jamais exposer de données sensibles dans les logs
- Valider et sanitiser toutes les entrées utilisateur
- Utiliser JWT pour l'authentification avec expiration appropriée
- Implémenter le principe du moindre privilège (vérifier les rôles)
- Protéger contre les injections SQL avec des requêtes paramétrées

## Documentation

### Commentaires
- Documenter les fonctions complexes avec JSDoc en français
- Expliquer le "pourquoi" plutôt que le "quoi" dans les commentaires
- Maintenir les commentaires à jour avec le code

### README et documentation
- Mettre à jour la documentation quand des changements importants sont faits
- Inclure des exemples d'utilisation pour les nouvelles APIs
- Documenter les variables d'environnement requises

## Docker

### Conventions
- Utiliser `docker-compose.dev.yml` pour le développement local
- Minimiser la taille des images Docker
- Utiliser des variables d'environnement pour la configuration
- Documenter les ports exposés et les volumes

## Git

### Commits
## Réponses et explications

### Format des réponses
- Être **concis mais complet** et **direct**
- Toujours répondre en **français**
- Expliquer les changements importants et leur impact
- Proposer des alternatives quand c'est pertinent
- Signaler les potentiels problèmes ou effets de bord
- Fournir des exemples de code quand nécessaire
- Utiliser des emojis pour clarifier (✅ ❌ ⚠️ 💡)

### Approche de résolution
- Comprendre le contexte avant de proposer une solution
- Privilégier les solutions robustes et maintenables
- Suivre les patterns déjà établis dans le projet
- Suggérer des améliorations si des problèmes sont détectés
- **Ne pas hésiter à corriger le code existant** s'il ne respecte pas les bonnes pratiques
- Toujours vérifier la cohérence entre backend et frontend
- Comprendre le contexte avant de proposer une solution
- Privilégier les solutions robustes et maintenables
- Suivre les patterns déjà établis dans le projet
- Suggérer des améliorations si des problèmes sont détectés
