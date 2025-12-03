/**
 * Test d'intégration : transitions de statuts demande/offre
 * Auteur : Copilot (décembre 2025)
 */
const request = require('supertest');
const app = require('../src/index').app;
const pool = require('../config/db');

// Utilisateurs fictifs
const client = { email: 'test_client_statut@example.com', password: 'Password123!', name: 'Client Test', role: 'client' };
const repairer = { email: 'test_repairer_statut@example.com', password: 'Password123!', name: 'Réparateur Test', role: 'repairer' };

let clientToken, repairerToken, repairRequestId, offerId;

describe('Gestion des statuts demande/offre', () => {
  beforeAll(async () => {
    // Nettoyage des utilisateurs
    await pool.query("DELETE FROM users WHERE email IN ($1, $2)", [client.email, repairer.email]);
    // Création client
    await request(app).post('/api/users/register').send(client);
    const loginClient = await request(app).post('/api/users/login').send({ email: client.email, password: client.password });
    clientToken = loginClient.body.token;
    // Création réparateur
    await request(app).post('/api/users/register').send(repairer);
    const loginRepairer = await request(app).post('/api/users/login').send({ email: repairer.email, password: repairer.password });
    repairerToken = loginRepairer.body.token;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM repair_offers WHERE repairer_id IN (SELECT id FROM users WHERE email = $1)", [repairer.email]);
    await pool.query("DELETE FROM repair_requests WHERE user_id IN (SELECT id FROM users WHERE email = $1)", [client.email]);
    await pool.query("DELETE FROM users WHERE email IN ($1, $2)", [client.email, repairer.email]);
    await pool.end();
  });

  test('Création demande → statut créée', async () => {
    const res = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ title: 'Test Statut', description: 'Vérification statut', bike_type: 'VTT' });
    expect(res.body.success).toBe(true);
    expect(res.body.repair.status).toBe('créée');
    repairRequestId = res.body.repair.id;
  });

  test('Création offre → statut proposée', async () => {
    const res = await request(app)
      .post('/api/repair-offers')
      .set('Authorization', `Bearer ${repairerToken}`)
      .send({ repair_request_id: repairRequestId, offered_price: 50, estimated_duration_hours: 2, message: 'Je peux réparer rapidement.' });
    expect(res.body.success).toBe(true);
    expect(res.body.offer.status).toBe('proposée');
    offerId = res.body.offer.id;
  });

  test('Acceptation offre → statut acceptée', async () => {
    const res = await request(app)
      .patch(`/api/repair-offers/${offerId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'accepted' });
    expect(res.body.success).toBe(true);
    expect(res.body.offer.status).toBe('accepted');
    // Vérifier que la demande est passée à acceptée
    const detail = await request(app)
      .get(`/api/repairs/detail/${repairRequestId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(detail.body.repair.status).toMatch(/acceptée|assigned/);
  });

  test('Refus offre → statut refusée', async () => {
    // Créer une nouvelle offre
    const resNew = await request(app)
      .post('/api/repair-offers')
      .set('Authorization', `Bearer ${repairerToken}`)
      .send({ repair_request_id: repairRequestId, offered_price: 60, estimated_duration_hours: 3, message: 'Offre alternative.' });
    expect(resNew.body.success).toBe(true);
    const newOfferId = resNew.body.offer.id;
    // Refuser l'offre
    const resRefuse = await request(app)
      .patch(`/api/repair-offers/${newOfferId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'rejected' });
    expect(resRefuse.body.success).toBe(true);
    expect(resRefuse.body.offer.status).toBe('rejected');
  });

  test('Clôture demande → statut terminée', async () => {
    const res = await request(app)
      .patch(`/api/repairs/${repairRequestId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'terminée' });
    expect(res.body.success).toBe(true);
    expect(res.body.repair.status).toBe('terminée');
  });
});
