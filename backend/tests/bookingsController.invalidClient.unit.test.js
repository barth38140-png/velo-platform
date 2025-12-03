beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('createBooking returns 400 when client_id is invalid', async () => {
  let calls = 0;
  jest.doMock('../src/db', () => ({
    query: jest.fn(() => {
      calls += 1;
      if (calls === 1) return Promise.resolve({ rowCount: 1 });
      return Promise.resolve({ rowCount: 0 });
    })
  }));

  const { createBooking } = require('../src/controllers/bookingsController');
  const req = { body: { listing_id: 1, client_id: 999, start_date: '2025-01-01', end_date: '2025-01-02' } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await createBooking(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_client_id' }));
});
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('createBooking returns 400 when client not found', async () => {
  const mockQuery = jest.fn()
    .mockResolvedValueOnce({ rowCount: 1 }) // listing exists
    .mockResolvedValueOnce({ rowCount: 0 }); // user missing
  jest.doMock('../src/db', () => ({ query: mockQuery }));

  const { createBooking } = require('../src/controllers/bookingsController');
  const req = { body: { listing_id: 1, client_id: 99, start_date: '2025-01-01', end_date: '2025-01-02' } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await createBooking(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_client_id' }));
});
