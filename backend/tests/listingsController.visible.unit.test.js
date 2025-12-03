/* tests/listingsController.visible.unit.test.js */
const { getListings } = require('../src/controllers/listingsController');

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('getListings handles visible query param and returns rows', async () => {
  // mock db.query
  jest.doMock('../src/db', () => ({ query: jest.fn(async (sql, params) => ({ rows: [{ id: 1, visible: params[0] }] })) }));
  const controller = require('../src/controllers/listingsController');

  const req = { query: { visible: 'true' } };
  const res = { json: jest.fn(), status: jest.fn().mockReturnValue({ json: jest.fn() }) };
  await controller.getListings(req, res);
  expect(res.json).toHaveBeenCalled();
});
