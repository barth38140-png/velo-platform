/* tests/listingsController.error.unit.test.js */
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('createListing returns 500 on db error and getListings returns 500 when db throws', async () => {
  jest.doMock('../src/db', () => ({ query: jest.fn(async () => { throw new Error('fail'); }) }));
  const controller = require('../src/controllers/listingsController');
  const res1 = { status: jest.fn().mockReturnValue({ json: jest.fn() }), json: jest.fn() };
  // include title so controller proceeds to DB and hits error branch
  await controller.createListing({ body: { repairer_id: 1, title: 't' } }, res1);
  expect(res1.status).toHaveBeenCalledWith(500);

  const res2 = { status: jest.fn().mockReturnValue({ json: jest.fn() }), json: jest.fn() };
  await controller.getListings({ query: {} }, res2);
  expect(res2.status).toHaveBeenCalledWith(500);
});
