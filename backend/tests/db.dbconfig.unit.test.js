const originalEnv = process.env;

describe('backend/db/db.js env handling', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  test('uses PGPASSWORD and DB_PORT when provided and logs when DEBUG_DB=true', () => {
    const mockPoolCtor = jest.fn(() => ({}));
    jest.mock('pg', () => ({ Pool: mockPoolCtor }));

    process.env.DEBUG_DB = 'true';
    process.env.PGPASSWORD = 'secret-pg';
    process.env.DB_PASSWORD = 'secret-db';
    process.env.DB_PORT = '5433';
    process.env.DB_USER = 'pguser';
    process.env.DB_NAME = 'pgdb';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});


    expect(mockPoolCtor).toHaveBeenCalled();
    const calledWith = mockPoolCtor.mock.calls[0][0];
    expect(calledWith.port).toBe(5433);
    expect(calledWith.password).toBe('secret-pg');
    expect(calledWith.user).toBe('pguser');
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('falls back to DB_PASSWORD and default port when PGPASSWORD and DB_PORT absent', () => {
    const mockPoolCtor = jest.fn(() => ({}));
    jest.mock('pg', () => ({ Pool: mockPoolCtor }));

    delete process.env.PGPASSWORD;
    process.env.DB_PASSWORD = 'only-db-pass';
    delete process.env.DB_PORT;

    // Suppression de la variable inutilisée 'pool' pour lint clean
    require('../db/db');
    const calledWith = mockPoolCtor.mock.calls[0][0];
    expect(calledWith.port).toBe(5432);
    expect(calledWith.password).toBe('only-db-pass');
  });
});
