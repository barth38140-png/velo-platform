beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('createBooking returns sql detail fields when client path throws detailed error', async () => {
  jest.doMock('../src/db', () => ({}));

  jest.doMock('pg', () => {
    class Client {
      async connect() { }
      async end() { }
      async query() {
        const e = new Error('boom');
        e.code = 'SOME_CODE';
        e.detail = 'detail text';
        e.table = 'bookings';
        e.column = 'listing_id';
        e.constraint = 'fk_listing';
        throw e;
      }
    }
    class Pool { constructor() {} on() {} end() {} }
    return { Client, Pool };
  });

  const { createBooking } = require('../src/controllers/bookingsController');
  const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await createBooking(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
    error: 'internal_error',
    sql_error: 'boom',
    sql_code: 'SOME_CODE',
    sql_detail: 'detail text',
    sql_table: 'bookings',
    sql_column: 'listing_id',
    sql_constraint: 'fk_listing'
  }));
});
