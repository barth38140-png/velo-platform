const express = require('express');
const request = require('supertest');
const { requireRole } = require('../middlewares/roles');

// small express app for testing
function createAppWithMiddleware(mw) {
  const app = express();
  app.use((req, res, next) => {
    // allow test to set req.user via header
    const userHeader = req.headers['x-test-user'];
    if (userHeader) {
      try { req.user = JSON.parse(userHeader); } catch (e) { req.user = null; }
    }
    next();
  });
  app.get('/test', mw, (req, res) => res.json({ ok: true }));
  return app;
}

describe('requireRole middleware', () => {
  test('allows user with required role', async () => {
    const app = createAppWithMiddleware(requireRole('client'));
    const user = { id: 1, role: 'client' };
    const res = await request(app).get('/test').set('x-test-user', JSON.stringify(user));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('blocks user without role with 403 and clear message', async () => {
    const app = createAppWithMiddleware(requireRole('client'));
    const user = { id: 2, role: 'repairer' };
    const res = await request(app).get('/test').set('x-test-user', JSON.stringify(user));
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/role\(s\) \[client\]/);
  });

  test('returns 401 when no user', async () => {
    const app = createAppWithMiddleware(requireRole('client'));
    const res = await request(app).get('/test');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
