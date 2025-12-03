// Test pool 'error' handler that contains an errors[] with ECONNREFUSED

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

jest.mock('dns', () => ({ promises: { lookup: jest.fn().mockResolvedValue({ address: '9.9.9.9' }) } }));

beforeEach(() => {
  poolInstances.length = 0;
  jest.clearAllMocks();
  delete require.cache[require.resolve('../src/db')];
});

test('pool error with errors[] triggers reinit and creates new pool', async () => {
  process.env.DB_HOST = 'orig-host';
  const db = require('../src/db');
  const { Pool } = require('pg');
  expect(Pool).toHaveBeenCalledTimes(1);
  const firstPool = poolInstances[0];

  // simulate error with errors[] containing ECONNREFUSED
  const err = { errors: [{ code: 'ECONNREFUSED' }] };
  // call the registered error handler
  expect(typeof firstPool._handlers.error).toBe('function');
  firstPool._handlers.error(err);

  // await a small tick for async reinitPool to run
  await new Promise((r) => setTimeout(r, 20));

  // Pool constructor should have been called again to create a new pool
  expect(Pool).toHaveBeenCalledTimes(2);
  delete process.env.DB_HOST;
});
