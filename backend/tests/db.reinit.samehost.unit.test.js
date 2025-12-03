/* tests/db.reinit.samehost.unit.test.js */
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('reinitPool no-op when dns resolves to same host', async () => {
  // set PGHOST so currentHost is predictable
  process.env.PGHOST = 'same-host';
  // mock dns.promises.lookup to return the same address as currentHost
  jest.doMock('dns', () => ({ promises: { lookup: async () => ({ address: 'same-host' }) } }));
  const db = require('../src/db');
  // should resolve without throwing and not recreate pool (no unhandled rejection)
  await expect(db.reinitPool()).resolves.toBeUndefined();
});
