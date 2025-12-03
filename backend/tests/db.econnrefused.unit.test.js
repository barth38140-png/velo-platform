// Test pool 'error' handler for single err.code === 'ECONNREFUSED'

const poolInstances = [];

jest.mock('pg', () => ({
  Pool: jest.fn((cfg) => {
    const p = {
      cfg,
      _handlers: {},
      on: (ev, cb) => { p._handlers[ev] = cb; },
      end: jest.fn(async () => {}),
      query: jest.fn(async () => ({ rows: [] }))
    };
    poolInstances.push(p);
    return p;
  })
}));

jest.mock('dns', () => ({ promises: { lookup: jest.fn().mockResolvedValue({ address: '1.2.3.4' }) } }));

beforeEach(() => {
  poolInstances.length = 0;
  jest.clearAllMocks();
  delete require.cache[require.resolve('../src/db')];
});

test('pool error with single err.code ECONNREFUSED triggers reinit and creates new pool', async () => {
  process.env.DB_HOST = 'will-fail';
  const db = require('../src/db');
  const { Pool } = require('pg');
  expect(Pool).toHaveBeenCalledTimes(1);
  const firstPool = poolInstances[0];

  // simulate error with code ECONNREFUSED
  const err = { code: 'ECONNREFUSED' };
  expect(typeof firstPool._handlers.error).toBe('function');
  firstPool._handlers.error(err);

  // small tick for async reinit
  await new Promise((r) => setTimeout(r, 20));
  expect(Pool).toHaveBeenCalledTimes(2);
  delete process.env.DB_HOST;
});
