// tests/health.test.js
const request = require('supertest');
const serverModule = require('../src/index');

// Use the app object directly to avoid depending on a listening port
test('GET /health returns ok', async () => {
  const res = await request(serverModule.app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});

