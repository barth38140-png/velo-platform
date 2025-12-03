/* tests/src.index.stop.error.unit.test.js */
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('stop rejects when db.pool.end throws', async () => {
  // mock src/db to have pool.end that throws
  jest.doMock('../src/db', () => ({ pool: { end: async () => { throw new Error('end fail'); } } }));
  // config/db present and has end that throws too
  jest.doMock('../config/db', () => ({ end: async () => { throw new Error('config end fail'); } }));

  const { start, stop } = require('../src/index');
  const srv = await start(0);
  expect(srv).toBeDefined();
  await expect(stop()).rejects.toThrow();
});
