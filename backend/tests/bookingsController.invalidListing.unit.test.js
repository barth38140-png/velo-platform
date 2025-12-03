beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('createBooking returns 400 when listing_id is invalid', async () => {
  jest.doMock('../src/db', () => ({
    query: jest.fn().mockResolvedValue({ rowCount: 0 })
  }));

  const { createBooking } = require('../src/controllers/bookingsController');
  const req = { body: { listing_id: 999, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await createBooking(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_listing_id' }));
});
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('createBooking returns 400 when listing not found', async () => {
  const mockQuery = jest.fn().mockResolvedValueOnce({ rowCount: 0 });
  jest.doMock('../src/db', () => ({ query: mockQuery }));

  const { createBooking } = require('../src/controllers/bookingsController');
  const req = { body: { listing_id: 9, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await createBooking(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_listing_id' }));
});
