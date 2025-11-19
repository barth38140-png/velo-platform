// tests/health.test.js
const request = require('supertest');
const serverModule = require('../src/index');

beforeAll(async () => {
  await serverModule.start(3000);
});

afterAll(async () => {
  await serverModule.stop();
});

test('GET /health returns ok', async () => {
  const res = await request('http://localhost:3000').get('/health');
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});

