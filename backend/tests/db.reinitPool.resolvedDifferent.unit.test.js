beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('reinitPool creates a new pool when dns.lookup resolves to a different address', async () => {
  const poolConstructs = [];

  jest.doMock('pg', () => {
    class Pool {
      constructor(conf) {
        this._conf = conf;
        poolConstructs.push(conf.host);
      }
      on() {}
      async end() { }
    }
    return { Pool };
  });

  jest.doMock('dns', () => ({
    promises: {
      lookup: jest.fn().mockResolvedValue({ address: '9.9.9.9' })
    }
  }));

  const db = require('../src/db');

  // initial Pool constructed with initial host
  expect(poolConstructs.length).toBe(1);

  await db.reinitPool();

  // After reinitPool, Pool should have been constructed again with the resolved address
  expect(poolConstructs.length).toBeGreaterThanOrEqual(2);
  expect(poolConstructs[poolConstructs.length - 1]).toBe('9.9.9.9');
});
