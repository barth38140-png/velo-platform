const originalEnv = process.env;

describe('backend/config/db.js loader and debug branches', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  test('logs config when DEBUG_DB=true and uses PG env precedence', () => {
    const mockPoolCtor = jest.fn(() => ({}));
    jest.mock('pg', () => ({ Pool: mockPoolCtor }));

    // mock dotenv to ensure config calls don't throw
    jest.mock('dotenv', () => ({ config: jest.fn() }));

    process.env.DEBUG_DB = 'true';
    process.env.PGHOST = 'pghost';
    process.env.PGPORT = '5433';
    process.env.PGUSER = 'pguser';
    process.env.PGPASSWORD = 'pgpass';
    process.env.PGDATABASE = 'pgdb';

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const pool = require('../config/db');

    expect(mockPoolCtor).toHaveBeenCalled();
    const calledWith = mockPoolCtor.mock.calls[0][0];
    expect(calledWith.host).toBe('pghost');
    expect(calledWith.port).toBe('5433');
    expect(calledWith.user).toBe('pguser');
    expect(calledWith.password).toBe('pgpass');
    expect(spy).toHaveBeenCalled();
  });

  test('continues when .env.local load throws (catch block)', () => {
    const mockPoolCtor = jest.fn(() => ({}));
    jest.mock('pg', () => ({ Pool: mockPoolCtor }));

    // mock dotenv so config() then throw when called with path
    jest.mock('dotenv', () => ({ config: jest.fn((opts) => { if (opts && opts.path) throw new Error('no local'); }) }));

    // ensure DEBUG_DB not set to avoid log
    delete process.env.DEBUG_DB;

    const pool = require('../config/db');
    expect(mockPoolCtor).toHaveBeenCalled();
  });
});
