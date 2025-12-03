describe('src/db reinitPool error catch path', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('when pool error triggers reinitPool which rejects, the catch logs a failure', async () => {
    const handlers = {};

    // Mock pg Pool to capture 'on' handler
    class MockPool {
      constructor() {}
      on(ev, fn) { handlers[ev] = fn; }
      end() { return Promise.resolve(); }
    }

    jest.mock('pg', () => ({ Pool: MockPool }));

    // Mock dns.promises.lookup to reject to force reinitPool to throw
    jest.mock('dns', () => ({ promises: { lookup: jest.fn(() => Promise.reject(new Error('dns fail'))) } }));

    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});

    const db = require('../src/db');

    // trigger the 'error' handler with ECONNREFUSED to call reinitPool().catch(...)
    expect(typeof handlers.error).toBe('function');
    handlers.error({ code: 'ECONNREFUSED' });

    // wait a tick for async reinitPool to run and be caught
    await new Promise((r) => setTimeout(r, 10));

    // Expect the catch handler to have logged the failure message
    expect(spyErr).toHaveBeenCalledWith(expect.stringContaining('[src/db] reinitPool failed:'), expect.anything());
    spyErr.mockRestore();
  });
});
