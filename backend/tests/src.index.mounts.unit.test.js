/* tests/src.index.mounts.unit.test.js */
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('requiring src/index mounts optional repair routes without throwing', async () => {
  // Provide simple middleware functions so app.use does not throw
  jest.doMock('../routes/repairRoutes', () => (req, res, next) => next());
  jest.doMock('../routes/repairOfferRoutes', () => (req, res, next) => next());

  const { app } = require('../src/index');
  expect(app).toBeDefined();
  // perform a smoke request to health to ensure app runs
  const request = require('supertest');
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
});
