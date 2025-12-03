describe('listingsController error branches', () => {
  beforeEach(() => jest.resetModules());

  test('createListing returns 500 on db.query throw', async () => {
    // mock ../src/db.query to throw
    jest.doMock('../src/db', () => ({ query: jest.fn(() => { throw new Error('fail'); }) }), { virtual: false });
    const { createListing } = require('../src/controllers/listingsController');
    const req = { body: { repairer_id: 1, title: 't' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await createListing(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getListings returns 500 on db.query throw', async () => {
    jest.resetModules();
    jest.doMock('../src/db', () => ({ query: jest.fn(() => { throw new Error('fail'); }) }), { virtual: false });
    const { getListings } = require('../src/controllers/listingsController');
    const req = { query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getListings(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
