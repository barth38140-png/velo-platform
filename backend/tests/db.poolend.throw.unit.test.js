// Test reinitPool path where closing old pool throws; ensure reinit still proceeds
const poolInstances = [];

jest.mock('pg', () => ({
  Pool: jest.fn((cfg) => {
    const p = {
      cfg,
      on: jest.fn(() => {}), // Suppression des variables inutilisées 'ev', 'cb'
      end: jest.fn(async () => { throw new Error('end failed'); }),
      query: jest.fn(async () => ({ rows: [] })), // Suppression des variables inutilisées 'text', 'params'
    };
    poolInstances.push(p);
    return p;
  })
}));

jest.mock('dns', () => ({ promises: { lookup: jest.fn() } }));

beforeEach(() => {
  poolInstances.length = 0;
  jest.clearAllMocks();
  jest.resetModules();
});

test('reinitPool continues even if pool.end throws (warn path)', async () => {
  process.env.DB_HOST = 'will-change';
  const dns = require('dns');
  dns.promises.lookup.mockResolvedValue({ address: '9.9.9.9' });

  const db = require('../src/db');
  // initial pool created
  expect(poolInstances.length).toBeGreaterThanOrEqual(1);
  const first = poolInstances[0];

  // calling reinitPool should attempt to end the old pool (which will throw) and still create a new pool
  await expect(db.reinitPool()).resolves.toBeUndefined();

  // pool.end was attempted
  expect(first.end).toHaveBeenCalled();
  // Pool constructor called again
  const Pool = require('pg').Pool;
  expect(Pool).toHaveBeenCalledTimes(2);

  delete process.env.DB_HOST;
});
