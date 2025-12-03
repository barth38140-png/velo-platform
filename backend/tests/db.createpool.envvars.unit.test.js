// Ensure Pool constructor receives env var fallbacks (user/password/database)
const poolInstances = [];

jest.mock('pg', () => ({
  Pool: jest.fn((cfg) => {
    const p = {
      cfg,
      on: jest.fn((ev, cb) => {}),
      end: jest.fn(async () => {}),
      query: jest.fn(async () => ({ rows: [] }))
    };
    poolInstances.push(p);
    return p;
  })
}));

beforeEach(() => {
  poolInstances.length = 0;
  jest.resetModules();
  jest.clearAllMocks();
});

test('Pool called with PG env variables when provided', () => {
  process.env.PGHOST = 'pghost';
  process.env.PGUSER = 'pguser';
  process.env.PGPASSWORD = 'pgpw';
  process.env.PGDATABASE = 'pgdb';
  process.env.PGPORT = '5433';

  const db = require('../src/db');
  const Pool = require('pg').Pool;
  expect(Pool).toHaveBeenCalled();
  const cfg = Pool.mock.calls[0][0];
  expect(cfg).toMatchObject({ host: 'pghost', port: 5433, user: 'pguser', password: 'pgpw', database: 'pgdb' });

  delete process.env.PGHOST;
  delete process.env.PGUSER;
  delete process.env.PGPASSWORD;
  delete process.env.PGDATABASE;
  delete process.env.PGPORT;
});
