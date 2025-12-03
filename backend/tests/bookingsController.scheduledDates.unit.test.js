beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('createBooking sets start_date and end_date when scheduled_from/scheduled_to provided', async () => {
  jest.doMock('../src/db', () => ({ query: jest.fn() }));
  const { createBooking } = require('../src/controllers/bookingsController');
  const req = { body: { scheduled_from: '2025-01-01T12:00:00Z', scheduled_to: '2025-01-02T12:00:00Z' } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await createBooking(req, res);

  // start_date / end_date should have been populated by the parsing block
  expect(req.body.start_date).toBe('2025-01-01');
  expect(req.body.end_date).toBe('2025-01-02');
  // missing listing_id/client_id should still cause a 400
  expect(res.status).toHaveBeenCalledWith(400);
});
