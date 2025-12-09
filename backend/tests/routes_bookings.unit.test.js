// Suppression de l'import inutilisé 'express' pour lint clean

describe('routes/bookings GET /:id handler branches', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('uses mocked db.query path and returns 404 when no rows', async () => {
    jest.resetModules();
    jest.doMock('../src/db', () => ({ query: jest.fn().mockResolvedValue({ rows: [] }) }));
    let handler;
    await jest.isolateModulesAsync(async () => {
      const router = require('../routes/bookings');
      const layer = router.stack.find(l => l.route && l.route.path === '/:id');
      handler = layer.route.stack[1].handle;
    });

    const req = { params: { id: '9' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'not_found' });
  });

  test('uses mocked db.query path and returns the row when present', async () => {
    jest.resetModules();
    jest.doMock('../src/db', () => ({ query: jest.fn().mockResolvedValue({ rows: [{ id: 5, foo: 'bar' }] }) }));
    let handler;
    await jest.isolateModulesAsync(async () => {
      const router = require('../routes/bookings');
      const layer = router.stack.find(l => l.route && l.route.path === '/:id');
      handler = layer.route.stack[1].handle;
    });

    const req = { params: { id: '5' } };
    const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ id: 5, foo: 'bar' });
  });
  test('falls back to pg Client path and returns row on success', async () => {
    jest.resetModules();
    jest.doMock('../src/db', () => ({ query: function realQuery() { return Promise.resolve({ rows: [] }); } }));
    jest.doMock('pg', () => ({ Client: class {
      constructor() {}
      connect() { return Promise.resolve(); }
      query() { return Promise.resolve({ rows: [{ id: 77 }] }); }
      end() { return Promise.resolve(); }
    } }));

    let handler;
    await jest.isolateModulesAsync(async () => {
      const router = require('../routes/bookings');
      const layer = router.stack.find(l => l.route && l.route.path === '/:id');
      handler = layer.route.stack[1].handle;
    });

    const req = { params: { id: '77' } };
    const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ id: 77 });
  });

  test('falls back to pg Client path and returns 500 on client.query error', async () => {
    jest.resetModules();
    jest.doMock('../src/db', () => ({ query: function realQuery() { return Promise.resolve({ rows: [] }); } }));
    jest.doMock('pg', () => ({ Client: class {
      constructor() {}
      connect() { return Promise.resolve(); }
      query() { return Promise.reject(new Error('boom')); }
      end() { return Promise.resolve(); }
    } }));

    let handler;
    await jest.isolateModulesAsync(async () => {
      const router = require('../routes/bookings');
      const layer = router.stack.find(l => l.route && l.route.path === '/:id');
      handler = layer.route.stack[1].handle;
    });

    const req2 = { params: { id: '88' } };
    const res2 = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
    await handler(req2, res2);
    expect(res2.status).toHaveBeenCalledWith(500);
  });
});
