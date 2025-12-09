/**
 * Test unitaire pour la route /api/admin/users/pending-verifications
 * Vérifie que la réponse contient bien la liste des réparateurs non vérifiés
 * Mock du JWT admin, du middleware et de la base de données
 */

const request = require('supertest');
const express = require('express');
const adminRoutesFactory = require('../routes/adminRoutes');
const userController = require('../controllers/userController');

jest.mock('../middlewares/auth', () => (req, res, next) => { req.user = { id: 1, role: 'admin' }; next(); });
jest.mock('../middlewares/isAdmin', () => (req, res, next) => { next(); });
jest.mock('../controllers/userController');

const app = express();
app.use(express.json());

// Création du routeur admin avec mocks pour les composants CI
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
