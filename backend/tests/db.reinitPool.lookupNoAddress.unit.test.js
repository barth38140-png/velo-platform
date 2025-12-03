const poolInstances = [];

jest.mock('pg', () => ({
  Pool: jest.fn((cfg) => {
    const p = { cfg, on: (ev, cb) => { p._handlers = p._handlers || {}; p._handlers[ev] = cb; }, end: jest.fn(async () => {}), query: jest.fn(async () => ({ rows: [] })) };
    poolInstances.push(p);
    return p;
  })
}));

jest.mock('dns', () => ({ promises: { lookup: jest.fn() } }));

beforeEach(() => {
  poolInstances.length = 0;
  jest.resetModules();
  jest.clearAllMocks();
});

test('reinitPool uses hostToResolve when dns.lookup returns no address (no-op if same)', async () => {
  process.env.DB_HOST = 'orig-host';
  const dns = require('dns');
  // lookup returns object without address
  dns.promises.lookup.mockResolvedValue({});
  const db = require('../src/db');
  // calling reinitPool should not throw and should be a no-op (resolved equals hostToResolve)
  await expect(db.reinitPool()).resolves.toBeUndefined();
  delete process.env.DB_HOST;
});
