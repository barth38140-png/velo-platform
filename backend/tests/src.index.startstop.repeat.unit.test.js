/* tests/src.index.startstop.repeat.unit.test.js */
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('start twice returns same server and stop twice is safe', async () => {
  // mock src/db to provide a pool with end()
  jest.doMock('../src/db', () => ({ pool: { end: async () => { /* ok */ } } }));
  const { start, stop } = require('../src/index');
  const srv1 = await start(0);
  expect(srv1).toBeDefined();
  const srv2 = await start(0);
  expect(srv2).toBe(srv1);
  // stopping twice: first stops, second resolves immediately
  await stop();
  await expect(stop()).resolves.toBeUndefined();
});
