
describe('bookingsController qExec fallback and retry', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('retries insert on ECONNREFUSED and eventually returns 201', async () => {
    // No mocked db.query so controller will use pg.Client fallback
    jest.doMock('../src/db', () => ({}), { virtual: true });

    let insertAttempts = 0;
    jest.doMock('pg', () => {
      class Client {
        async connect() { }
        async end() { }
        async query(sql, params) {
          if (sql.startsWith('SELECT 1 FROM listings')) return { rowCount: 1, rows: [ {} ] };
          if (sql.startsWith('SELECT 1 FROM users')) return { rowCount: 1, rows: [ {} ] };
          if (sql.includes('FROM bookings WHERE listing_id')) return { rowCount: 0, rows: [] };
          if (sql.startsWith('INSERT INTO bookings')) {
            insertAttempts += 1;
            if (insertAttempts < 3) {
              const e = new Error('connrefused');
              e.code = 'ECONNREFUSED';
              throw e;
            }
            return { rows: [ { id: 555, listing_id: params[0], client_id: params[1], start_date: params[2], end_date: params[3] } ] };
          }
          return { rowCount: 0, rows: [] };
        }
      }
      // Provide a minimal Pool so require('../../src/db') can construct it during module load
      class Pool {
        constructor() { }
        on() { }
        end() { }
      }
      return { Client, Pool };
    });

    const { createBooking } = require('../src/controllers/bookingsController');

    const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, id: 555 }));
  });
});
