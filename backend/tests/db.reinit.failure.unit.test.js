/* tests/db.reinit.failure.unit.test.js */
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('reinitPool throws when dns.lookup fails', async () => {
  // Mock dns.promises.lookup to throw
  jest.doMock('dns', () => ({ promises: { lookup: async () => { throw new Error('dns failed'); } } }));

  const db = require('../src/db');
  // reinitPool should reject
  await expect(db.reinitPool()).rejects.toThrow('dns failed');
});
