jest.mock('pg', () => ({ Pool: jest.fn(() => ({ on: () => {}, end: async () => {}, query: async () => ({ rows: [] }) })) }));
jest.mock('dns', () => ({ promises: { lookup: jest.fn() } }));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('reinitPool returns early when hostToResolve is falsy', async () => {
  process.env.PGHOST = '';
  const db = require('../src/db');
  await expect(db.reinitPool()).resolves.toBeUndefined();
  delete process.env.PGHOST;
});
