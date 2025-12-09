describe('src/index stop error paths', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('stop rejects when db.pool.end and configDbPool.end reject', async () => {
    // Mock the db and config/db modules to provide end() that reject
    jest.doMock('../src/db', () => ({ pool: { end: jest.fn(() => Promise.reject(new Error('dbendfail'))) } }), { virtual: false });
    jest.doMock('../config/db', () => ({ end: jest.fn(() => Promise.reject(new Error('cfgendfail'))) }), { virtual: false });

    const idx = require('../src/index');
    // start server (random port)
    await idx.start(0);
    await expect(idx.stop()).rejects.toThrow();
    // cleanup: ensure server is cleared
    try { await idx.stop(); } catch {}
  });
});
