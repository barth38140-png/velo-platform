const { createBooking, getBookings } = require('../src/controllers/bookingsController');

jest.mock('../src/db', () => ({
  query: jest.fn()
}));
const db = require('../src/db');

describe('bookingsController (unit)', () => {
  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createBooking - missing fields returns 400', async () => {
    const req = { body: {} };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const sent = res.json.mock.calls[0][0];
    expect(sent).toHaveProperty('error', 'missing_fields');
  });

  test('createBooking - invalid listing_id returns 400', async () => {
    // checkListing returns rowCount 0
    db.query.mockResolvedValueOnce({ rowCount: 0 });
    const req = { body: { listing_id: 1, client_id: 2, start_date: '2021-01-01', end_date: '2021-01-02' } };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const sent = res.json.mock.calls[0][0];
    expect(sent).toHaveProperty('error', 'invalid_listing_id');
  });

  test('createBooking - invalid client_id returns 400', async () => {
    // first: listing exists
    db.query.mockResolvedValueOnce({ rowCount: 1 });
    // second: client not found
    db.query.mockResolvedValueOnce({ rowCount: 0 });
    const req = { body: { listing_id: 1, client_id: 99, start_date: '2021-01-01', end_date: '2021-01-02' } };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const sent = res.json.mock.calls[0][0];
    expect(sent).toHaveProperty('error', 'invalid_client_id');
  });

  test('createBooking - idempotent returns existing booking (200)', async () => {
    // listing exists
    db.query.mockResolvedValueOnce({ rowCount: 1 });
    // client exists
    db.query.mockResolvedValueOnce({ rowCount: 1 });
    // existing booking found
    const existing = { id: 5, listing_id: 1, client_id: 2 };
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [existing] });
    const req = { body: { listing_id: 1, client_id: 2, start_date: '2021-01-01', end_date: '2021-01-02' } };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const sent = res.json.mock.calls[0][0];
    expect(sent).toEqual(existing);
  });

  test('createBooking - success inserts and returns 201', async () => {
    // listing exists
    db.query.mockResolvedValueOnce({ rowCount: 1 });
    // client exists
    db.query.mockResolvedValueOnce({ rowCount: 1 });
    // no existing booking
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    // insert returns created
    const created = { id: 10, listing_id: 1, client_id: 2 };
    db.query.mockResolvedValueOnce({ rows: [created] });

    const req = { body: { listing_id: 1, client_id: 2, start_date: '2021-01-01', end_date: '2021-01-02' } };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    const sent = res.json.mock.calls[0][0];
    expect(sent).toEqual(created);
  });

  test('createBooking - SQL foreign key error returns 400', async () => {
    // listing exists
    db.query.mockResolvedValueOnce({ rowCount: 1 });
    // client exists
    db.query.mockResolvedValueOnce({ rowCount: 1 });
    // no existing booking
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    // insert throws foreign key error
    const err = new Error('fk');
    err.code = '23503';
    db.query.mockRejectedValueOnce(err);
    const req = { body: { listing_id: 1, client_id: 2, start_date: '2021-01-01', end_date: '2021-01-02' } };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const sent = res.json.mock.calls[0][0];
    expect(sent).toHaveProperty('error', 'foreign_key_violation');
  });

  test('getBookings - returns rows using mock db', async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    db.query.mockResolvedValueOnce({ rows });
    const req = { query: { client_id: 2 } };
    const res = mockRes();
    await getBookings(req, res);
    expect(res.json).toHaveBeenCalledWith(rows);
  });
});
