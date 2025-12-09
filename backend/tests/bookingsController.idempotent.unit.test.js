// Ensure createBooking returns existing booking when checkBooking.rowCount > 0
describe('bookingsController idempotence', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('createBooking returns existing booking (idempotent) when checkBooking.rowCount > 0', async () => {
    // Provide a mocked db with sequenced responses for the various queries
    jest.doMock('../src/db', () => ({
      query: jest.fn((sql, params) => {
        // SELECT 1 FROM listings
        if (sql.startsWith('SELECT 1 FROM listings')) return Promise.resolve({ rowCount: 1 });
        // SELECT 1 FROM users
        if (sql.startsWith('SELECT 1 FROM users')) return Promise.resolve({ rowCount: 1 });
        // SELECT * FROM bookings (idempotence check) -> return an existing booking
        if (sql.includes('SELECT * FROM bookings WHERE')) return Promise.resolve({ rowCount: 1, rows: [{ id: 111, listing_id: params[0], client_id: params[1] }] });
        // fallback
        return Promise.resolve({ rowCount: 0, rows: [] });
      })
    }), { virtual: false });

    const { createBooking } = require('../src/controllers/bookingsController');

    const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, booking: { id: 111, listing_id: 1, client_id: 2 } });
  });
});
