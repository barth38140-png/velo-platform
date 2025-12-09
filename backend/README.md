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

### 🔐 Tester les routes admin protégées

Pour tester les routes protégées par JWT et rôle admin (ex : `/api/admin/users/pending-verifications`), utilisez Jest avec Supertest et mockez les middlewares d'authentification :

```js
jest.mock('../middlewares/auth', () => (req, res, next) => { req.user = { id: 1, role: 'admin' }; next(); });
jest.mock('../middlewares/isAdmin', () => (req, res, next) => { next(); });
```

Exemple de test :

```js
const request = require('supertest');
const express = require('express');
const adminRoutesFactory = require('../routes/adminRoutes');
const userController = require('../controllers/userController');

jest.mock('../controllers/userController');

const app = express();
app.use(express.json());
const adminRoutes = adminRoutesFactory({
	continuousImprovement: {},
	autoFixer: {},
	githubIntegration: {},
	predictiveAnalytics: {}
});
app.use('/api/admin', adminRoutes);

describe('GET /api/admin/users/pending-verifications', () => {
	it('retourne la liste des réparateurs non vérifiés', async () => {
		userController.getPendingVerifications.mockImplementation((req, res) => {
			res.json({ success: true, pending: [{ id: 42, email: 'test@velo.fr', name: 'Réparateur', role: 'repairer', verified: false }] });
		});
		const res = await request(app)
			.get('/api/admin/users/pending-verifications')
			.set('Authorization', 'Bearer fake-admin-token');
		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.pending)).toBe(true);
		expect(res.body.pending[0].role).toBe('repairer');
		expect(res.body.pending[0].verified).toBe(false);
	});
});
```

💡 Pensez à mocker la base de données pour isoler la logique métier.

➡️ Placez vos tests dans `backend/tests/` et nommez-les de façon descriptive (`adminRoutes.unit.test.js`).

## 📖 Documentation
- Voir le README.md racine pour les règles globales
- Ce fichier doit être enrichi à chaque évolution technique
