// Ensure src/index handles when requiring ../config/db throws during module initialization
describe('src/index config db require throwing', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('requiring src/index handles missing config/db gracefully', async () => {
    // Register a virtual mock whose factory will throw when required by src/index
    jest.doMock('../config/db', () => { throw new Error('no config db'); }, { virtual: true });
    // Use isolateModules to ensure the module is required within a fresh module registry
    let mod;
    jest.isolateModules(() => {
      mod = require('../src/index');
    });
    // start and stop should still be present
    expect(typeof mod.start).toBe('function');
    expect(typeof mod.stop).toBe('function');
  });
});
