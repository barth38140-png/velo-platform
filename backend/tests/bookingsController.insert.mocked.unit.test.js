beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('createBooking uses mocked db insert path and returns 201', async () => {
  // First three queries: listing, user, checkBooking -> then insert
  const mockQuery = jest.fn()
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({ rowCount: 0, rows: [] })
    .mockResolvedValueOnce({ rows: [{ id: 777 }] });
  jest.doMock('../src/db', () => ({ query: mockQuery }));

  const { createBooking } = require('../src/controllers/bookingsController');
  const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await createBooking(req, res);

  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith({ success: true, booking: { id: 777 } });
});
