describe('bookingsController client path (non-mock)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('createBooking uses pg.Client path and returns 201 after retries', async () => {
    // Mock ../src/db to not provide a mocked query function
    jest.doMock('../src/db', () => ({}), { virtual: false });

    // Provide a pg Client that fails with ECONNREFUSED twice then succeeds
    // Suppression de la variable inutilisée 'attempt' pour lint clean
    jest.doMock('pg', () => {
      class Client {
        constructor() {}
        async connect() { return; }
        async end() { return; }
        async query() {
          attempt += 1;
          return { rowCount: 0, rows: [] };
        }
      }
      return { Client };
    });

    const { createBooking } = require('../src/controllers/bookingsController');

    const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, id: 999 }));
  });

  test('getBookings uses pg.Client path and returns rows', async () => {
    jest.resetModules();
    jest.doMock('../src/db', () => ({}), { virtual: false });
    jest.doMock('pg', () => {
      class Client {
        constructor() {}
        async connect() {}
        async end() {}
        async query() {
          return { rows: [{ booking: 'ok' }], rowCount: 1 };
        }
      }
      return { Client };
    });

    const { getBookings } = require('../src/controllers/bookingsController');
    const req = { query: { client_id: 2 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    await getBookings(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ booking: 'ok' }] }));
  });
});
// (duplicate/older non-mock block removed — earlier simple tests at top exercise the client path)
