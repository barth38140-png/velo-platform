/* tests/bookingsController.errors.unit.test.js */
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('createBooking handles AggregateError-like error with errors[]', async () => {
  // mock db.query for the initial checks
  const agg = new Error('aggregate');
  agg.errors = [{ code: 'ECONNREFUSED' }, { code: 'OTHER' }];
  // first two queries (listing and user) succeed; third (checkBooking) returns none; insert throws agg
  jest.doMock('../src/db', () => ({ query: jest.fn()
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({ rowCount: 0, rows: [] })
    .mockRejectedValueOnce(agg)
  }));

  const { createBooking } = require('../src/controllers/bookingsController');
  const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
  const res = { status: jest.fn().mockReturnValue({ json: jest.fn() }), json: jest.fn() };
  await createBooking(req, res);
  expect(res.status).toHaveBeenCalledWith(500);
});

test('getBookings handles AggregateError-like thrown error', async () => {
  const agg = new Error('agg');
  agg.errors = [{ code: 'X' }];
  jest.doMock('../src/db', () => ({ query: jest.fn(() => { throw agg; }) }));
  const { getBookings } = require('../src/controllers/bookingsController');
  const req = { query: { client_id: 2 } };
  const res = { status: jest.fn().mockReturnValue({ json: jest.fn() }), json: jest.fn() };
  await getBookings(req, res);
  expect(res.status).toHaveBeenCalledWith(500);
});
