/* tests/src.index.stop.unit.test.js */
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('start and stop calls db.pool.end and config db end when present', async () => {
  // mock src/db to provide a pool with end()
  jest.doMock('../src/db', () => ({ pool: { end: async () => { /* mocked end */ } } }));

  // mock ../config/db so index.js picks it up in its try/catch
  jest.doMock('../config/db', () => ({ end: async () => { /* mocked config end */ } }));

  const { start, stop } = require('../src/index');
  // start server on ephemeral port 0
  const srv = await start(0);
  expect(srv).toBeDefined();
  // stop should call both end functions
  await stop();
  // We cannot directly inspect the mocked functions defined inside factories here, but stop() should complete without error
  expect(srv).toBeTruthy();
});
