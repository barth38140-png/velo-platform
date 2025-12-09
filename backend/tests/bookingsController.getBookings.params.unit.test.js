describe('bookingsController getBookings params', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('getBookings builds where clause with both repairer_id and client_id', async () => {
    jest.doMock('../src/db', () => ({
      query: jest.fn(async (sql, params) => {
        // ensure both params are passed and where clause built
        expect(sql).toMatch(/WHERE/);
        expect(params.length).toBe(2);
        return { rows: [{ ok: true }], rowCount: 1 };
      })
    }), { virtual: false });

    const { getBookings } = require('../src/controllers/bookingsController');
    const req = { query: { client_id: '2', repairer_id: '5' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    await getBookings(req, res);
    expect(res.json).toHaveBeenCalledWith({ success: true, bookings: [{ ok: true }] });
  });
});
