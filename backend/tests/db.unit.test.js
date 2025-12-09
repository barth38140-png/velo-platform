// Unit tests for src/db.js
// We mock 'pg' and 'dns' before requiring the module so module-init code runs against mocks.

const poolInstances = [];

jest.mock('pg', () => ({
  Pool: jest.fn((cfg) => {
    const p = {
      cfg,
      on: jest.fn(() => {}), // Suppression des variables inutilisées 'ev', 'cb'
      end: jest.fn(async () => {}),
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
});

test('initial pool is created with env host', () => {
  process.env.DB_HOST = 'postgres-host';
  // require after setting env and mocks
  require('../src/db'); // Suppression de la variable inutilisée 'db'
  const { Pool } = require('pg');
  expect(Pool).toHaveBeenCalled();
  expect(Pool.mock.calls[0][0]).toMatchObject({ host: 'postgres-host' });
  // cleanup module cache to avoid cross-test leakage
  delete require.cache[require.resolve('../src/db')];
  delete process.env.DB_HOST;
});

test('reinitPool resolves DNS and recreates pool when address changes', async () => {
  process.env.DB_HOST = 'orig-host';
  const db = require('../src/db');
  const { Pool } = require('pg');

  // initial pool created
  expect(Pool).toHaveBeenCalledTimes(1);
  const firstPool = poolInstances[0];

  // make dns lookup return a new IPv4 address
  const dns = require('dns');
  dns.promises.lookup.mockResolvedValue({ address: '1.2.3.4' });

  await db.reinitPool();

  // pool.end should have been called on the old pool
  expect(firstPool.end).toHaveBeenCalled();
  // Pool constructor called again to create new pool with resolved IP
  expect(Pool).toHaveBeenCalledTimes(2);
  const secondCfg = Pool.mock.calls[1][0];
  expect(secondCfg).toMatchObject({ host: '1.2.3.4' });

  delete require.cache[require.resolve('../src/db')];
  delete process.env.DB_HOST;
});

test('reinitPool throws if dns.lookup fails', async () => {
  process.env.DB_HOST = 'will-fail';
  const db = require('../src/db');
  const dns = require('dns');
  dns.promises.lookup.mockRejectedValue(new Error('dns fail'));
  await expect(db.reinitPool()).rejects.toThrow('dns fail');
  delete require.cache[require.resolve('../src/db')];
  delete process.env.DB_HOST;
});

test('query forwards to pool.query', async () => {
  process.env.DB_HOST = 'q-host';
  const db = require('../src/db');
  const firstPool = poolInstances[0];
  firstPool.query.mockResolvedValue({ rows: [{ ok: true }] });
  const res = await db.query('SELECT 1');
  expect(firstPool.query).toHaveBeenCalledWith('SELECT 1', undefined);
  expect(res.rows[0]).toEqual({ ok: true });
  delete require.cache[require.resolve('../src/db')];
  delete process.env.DB_HOST;
});
