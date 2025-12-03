/* tests/src.index.catchmounts.throwing.unit.test.js */
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

// Increase timeout for this test which requires module loading and express startup
jest.setTimeout(30000);

test('requiring src/index handles repair route require throwing', async () => {
  // Make require('../routes/repairRoutes') throw when required to exercise the catch block
  jest.doMock('../routes/repairRoutes', () => { throw new Error('simulate missing module'); });
  jest.doMock('../routes/repairOfferRoutes', () => { throw new Error('simulate missing module 2'); });

  const { app } = require('../src/index');
  expect(app).toBeDefined();
  const request = require('supertest');
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
});
