describe('bookingsController extra error branches', () => {
  beforeEach(() => jest.resetModules());

  test('createBooking swallows parse error in initial try block and continues', async () => {
    // Create a faulty Date constructor to force an exception inside the top-level try
    const origDate = global.Date;
    // make Date constructor throw when called
    // We mock by replacing Date with a function that throws when invoked as a constructor
    function BadDate() { throw new Error('bad date'); }
    global.Date = BadDate;

    const controller = require('../src/controllers/bookingsController');
    const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.createBooking(req, res);

    expect(res.status).toHaveBeenCalled();

    // restore
    global.Date = origDate;
  });

  test('createBooking handles error objects without stack and returns 500', async () => {
    jest.resetModules();
    // mock db.query so it throws a plain object (no stack)
    jest.doMock('../src/db', () => ({ query: jest.fn(() => { const e = { message: 'plain', code: undefined }; throw e; }) }), { virtual: false });
    const controller = require('../src/controllers/bookingsController');
    const req = { body: { listing_id: 1, client_id: 2, start_date: '2025-01-01', end_date: '2025-01-02' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.createBooking(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'internal_error', message: 'Erreur interne du serveur' });
  });
});
