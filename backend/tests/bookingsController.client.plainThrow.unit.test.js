beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('createBooking with pg Client path throws plain error and returns 500', async () => {
  // Make db.query absent so controller uses pg.Client path
  jest.doMock('../src/db', () => ({}));

  jest.doMock('pg', () => {
    class Client {
      async connect() { }
      async end() { }
      async query() { throw new Error('plain-failure'); }
    }
    class Pool { constructor() {} on() {} end() {} }
    return { Client, Pool };
  });

  const { createBooking } = require('../src/controllers/bookingsController');
  const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await createBooking(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'internal_error' }));
});
