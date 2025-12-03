describe('bookingsController getBookings plain throw', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('getBookings returns 500 when db.query throws a plain Error', async () => {
    jest.doMock('../src/db', () => ({
      query: jest.fn(() => { throw new Error('plain failure'); })
    }), { virtual: false });

    const { getBookings } = require('../src/controllers/bookingsController');
    const req = { query: { client_id: 2 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getBookings(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'internal_error' });
  });
});
