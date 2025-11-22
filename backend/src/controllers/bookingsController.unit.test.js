const { createBooking, getBookings } = require('./bookingsController');

// Mocks
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

jest.mock('../db', () => ({
  query: jest.fn()
}));
const db = require('../db');

describe('bookingsController.createBooking', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('should return 400 if required fields are missing', async () => {
    const req = { body: { listing_id: 1 } };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'missing_fields' }));
  });

  it('should return 400 if listing_id does not exist', async () => {
    db.query.mockImplementationOnce(() => ({ rowCount: 0 }));
    const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_listing_id' }));
  });

  it('should return 400 if client_id does not exist', async () => {
    db.query
      .mockImplementationOnce(() => ({ rowCount: 1 })) // listing exists
      .mockImplementationOnce(() => ({ rowCount: 0 })); // user does not
    const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_client_id' }));
  });

  it('should return 200 if booking already exists (idempotent)', async () => {
    db.query
      .mockImplementationOnce(() => ({ rowCount: 1 })) // listing exists
      .mockImplementationOnce(() => ({ rowCount: 1 })) // user exists
      .mockImplementationOnce(() => ({ rowCount: 1, rows: [{ id: 42 }] })); // booking exists
    const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }));
  });

  it('should return 201 and booking if creation succeeds', async () => {
    db.query
      .mockImplementationOnce(() => ({ rowCount: 1 })) // listing exists
      .mockImplementationOnce(() => ({ rowCount: 1 })) // user exists
      .mockImplementationOnce(() => ({ rowCount: 0 })) // booking does not exist
      .mockImplementationOnce(() => ({ rows: [{ id: 99 }] })); // insert
    const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 99 }));
  });

  it('should return 500 on SQL error', async () => {
    db.query
      .mockImplementationOnce(() => ({ rowCount: 1 })) // listing exists
      .mockImplementationOnce(() => ({ rowCount: 1 })) // user exists
      .mockImplementationOnce(() => { throw new Error('SQL fail'); });
    const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
    const res = mockRes();
    await createBooking(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'internal_error' }));
  });
});

describe('bookingsController.getBookings', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('should return bookings with filters', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });
    const req = { query: { client_id: 2 } };
    const res = mockRes();
    await getBookings(req, res);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
  });

  it('should handle SQL error in getBookings', async () => {
    db.query.mockImplementationOnce(() => { throw new Error('fail'); });
    const req = { query: {} };
    const res = mockRes();
    await getBookings(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'internal_error' }));
  });
});
