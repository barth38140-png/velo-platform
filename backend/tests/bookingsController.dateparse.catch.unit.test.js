describe('bookingsController date-parse try/catch', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('catches error thrown when accessing scheduled_from and returns 400', async () => {
    // Mock db.query to make shouldUseMock truthy so we don't hit pg.Client paths
    jest.doMock('../src/db', () => ({ query: jest.fn() }), { virtual: true });

    const { createBooking } = require('../src/controllers/bookingsController');

    const badBody = {};
    Object.defineProperty(badBody, 'scheduled_from', { get: () => { throw new Error('boom'); } });
    // No listing_id etc so after parse-catch the controller should return 400

    const req = { body: badBody };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'missing_fields' }));
  });
});
