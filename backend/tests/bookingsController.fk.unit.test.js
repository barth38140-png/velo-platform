describe('bookingsController foreign key handling', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('createBooking returns 400 on foreign key violation (23503)', async () => {
    // Mock db: listings and users exist, but insert throws with code 23503
    jest.doMock('../src/db', () => ({
      query: jest.fn((sql) => {
        if (sql.startsWith('SELECT 1 FROM listings')) return Promise.resolve({ rowCount: 1 });
        if (sql.startsWith('SELECT 1 FROM users')) return Promise.resolve({ rowCount: 1 });
        if (sql.startsWith('SELECT * FROM bookings WHERE')) return Promise.resolve({ rowCount: 0, rows: [] });
        if (sql.startsWith('INSERT INTO bookings')) {
          const e = new Error('foreign key');
          e.code = '23503';
          e.detail = 'Key (listing_id)=(999) is not present in table "listings".';
          return Promise.reject(e);
        }
        return Promise.resolve({ rowCount: 0, rows: [] });
      })
    }), { virtual: false });

    const { createBooking } = require('../src/controllers/bookingsController');
    const req = { body: { listing_id: 999, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'foreign_key_violation' }));
  });
});
