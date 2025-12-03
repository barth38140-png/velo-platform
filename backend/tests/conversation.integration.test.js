/**
 * Test d'intégration : messagerie client ↔ réparateur
 * Auteur : Copilot (décembre 2025)
 */
const request = require('supertest');
const app = require('../src/index').app;
const pool = require('../config/db');

const client = { email: 'test_client_chat@example.com', password: 'Password123!', name: 'Client Chat', role: 'client' };
const repairer = { email: 'test_repairer_chat@example.com', password: 'Password123!', name: 'Réparateur Chat', role: 'repairer' };

let clientToken, repairerToken, repairRequestId, conversationId;

describe('Messagerie client ↔ réparateur', () => {
  beforeAll(async () => {
    await pool.query("DELETE FROM users WHERE email IN ($1, $2)", [client.email, repairer.email]);
    await request(app).post('/api/users/register').send(client);
    const loginClient = await request(app).post('/api/users/login').send({ email: client.email, password: client.password });
    clientToken = loginClient.body.token;
    await request(app).post('/api/users/register').send(repairer);
    const loginRepairer = await request(app).post('/api/users/login').send({ email: repairer.email, password: repairer.password });
    repairerToken = loginRepairer.body.token;
    // Créer une demande pour la conversation
    const repairRes = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        title: 'Chat Test',
        description: 'Test messagerie',
        bike_type: 'VTT',
        location_lat: 48.8566,
        location_lng: 2.3522,
        location_address: 'Paris, France'
      });
    repairRequestId = repairRes.body.repair.id;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE client_id IN (SELECT id FROM users WHERE email = $1))", [client.email]);
    await pool.query("DELETE FROM conversations WHERE client_id IN (SELECT id FROM users WHERE email = $1)", [client.email]);
    await pool.query("DELETE FROM repair_requests WHERE user_id IN (SELECT id FROM users WHERE email = $1)", [client.email]);
    await pool.query("DELETE FROM users WHERE email IN ($1, $2)", [client.email, repairer.email]);
    await pool.end();
  });

  test('Création conversation', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ repairerId: 2, repairRequestId: repairRequestId });
    expect(res.body.success).toBe(true);
    expect(res.body.conversation).toBeDefined();
    conversationId = res.body.conversation.id;
  });

  test('Envoi message client → réparateur', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Bonjour, pouvez-vous intervenir ?' });
    expect(res.body.success).toBe(true);
    expect(res.body.message.content).toBe('Bonjour, pouvez-vous intervenir ?');
  });

  test('Envoi message réparateur → client', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${repairerToken}`)
      .send({ content: 'Oui, je suis disponible demain.' });
    expect(res.body.success).toBe(true);
    expect(res.body.message.content).toBe('Oui, je suis disponible demain.');
  });

  test('Récupération des messages', async () => {
    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.body.success).toBe(true);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(2);
    expect(res.body.messages[0].content).toBe('Bonjour, pouvez-vous intervenir ?');
    expect(res.body.messages[1].content).toBe('Oui, je suis disponible demain.');
  });
});
