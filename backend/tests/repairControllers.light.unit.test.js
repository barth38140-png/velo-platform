/* tests/repairControllers.light.unit.test.js */
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

test('repairController basic flows (create/get/update/pending)', async () => {
  // mock model functions
  jest.doMock('../models/repairModel', () => ({
    createRepairRequest: jest.fn(async () => ({ id: 1 })),
    getRepairRequestsByUser: jest.fn(async () => ([{ id: 2, photos: [{ id: 7, filename: 'p.jpg' }] }])), // Suppression de 'userId' non utilisé
    getRepairRequestById: jest.fn(async (id) => (id === 'notfound' ? null : { id, photos: [] , user_id: 99 })),
    updateRepairRequestStatus: jest.fn(async () => ({ id: 3 })),
    getAllRepairRequests: jest.fn(async () => ([]))
  }));

  const rc = require('../controllers/repairController');
  // createRepair: missing title -> 400
  const res1 = mockRes();
  await rc.createRepair({ body: { description: 'd' }, user: { id: 1 } }, res1);
  expect(res1.status).toHaveBeenCalledWith(400);

  // createRepair success
  const res2 = mockRes();
  await rc.createRepair({ body: { title: 't', description: 'd' }, user: { id: 2 } }, res2);
  expect(res2.status).toHaveBeenCalledWith(201);

  // getRepairs
  const res3 = mockRes();
  await rc.getRepairs({ user: { id: 2 } }, res3);
  expect(res3.json).toHaveBeenCalled();

  // getRepairDetail not found
  const res4 = mockRes();
  await rc.getRepairDetail({ params: { requestId: 'notfound' } }, res4);
  expect(res4.status).toHaveBeenCalledWith(404);

  // getRepairDetail found
  const res5 = mockRes();
  await rc.getRepairDetail({ params: { requestId: '1' } }, res5);
  expect(res5.json).toHaveBeenCalled();

  // updateRepairStatus missing status -> 400
  const res6 = mockRes();
  await rc.updateRepairStatus({ params: { requestId: '1' }, body: {}, user: { id: 1 } }, res6);
  expect(res6.status).toHaveBeenCalledWith(400);

  // getPendingRepairs
  const res7 = mockRes();
  await rc.getPendingRepairs({}, res7);
  expect(res7.json).toHaveBeenCalled();
});

test('repairOfferController basic flows', async () => {
  // prepare mocks for models
  jest.doMock('../models/repairOfferModel', () => ({
    hasExistingOffer: jest.fn(async () => false),
    createRepairOffer: jest.fn(async () => ({ id: 10 })),
    getOffersByRepairRequest: jest.fn(async () => ([])),
    getOffersByRepairer: jest.fn(async () => ([])),
    getOffersByClient: jest.fn(async () => ([])),
    getOfferById: jest.fn(async (id) => (id === 'nf' ? null : { id, repair_request_id: 5, repairer_id: 7 })),
    updateOfferStatus: jest.fn(async () => ({ id: 11, repairer_id: 7 }))
  }));
  jest.doMock('../models/repairModel', () => ({
    getRepairRequestById: jest.fn(async (id) => ({ id, user_id: 42 })),
    updateRepairRequestStatus: jest.fn(async () => ({ id: 5 }))
  }));

  const roc = require('../controllers/repairOfferController');

  // createOffer when existing offer true -> 400
  const offerModel = require('../models/repairOfferModel');
  offerModel.hasExistingOffer.mockResolvedValueOnce(true);
  const res1 = mockRes();
  await roc.createOffer({ body: { repair_request_id: 1 }, user: { id: 3 } }, res1);
  expect(res1.status).toHaveBeenCalledWith(400);

  // createOffer repair not found -> 404
  offerModel.hasExistingOffer.mockResolvedValueOnce(false);
  const repairModel = require('../models/repairModel');
  repairModel.getRepairRequestById.mockResolvedValueOnce(null);
  const res2 = mockRes();
  await roc.createOffer({ body: { repair_request_id: 2 }, user: { id: 3 } }, res2);
  expect(res2.status).toHaveBeenCalledWith(404);

  // createOffer success
  repairModel.getRepairRequestById.mockResolvedValueOnce({ id: 2 });
  const res3 = mockRes();
  await roc.createOffer({ body: { repair_request_id: 2 }, user: { id: 3 } }, res3);
  expect(res3.status).toHaveBeenCalledWith(201);

  // getOffersForRepair
  const res4 = mockRes();
  await roc.getOffersForRepair({ params: { repairId: '2' } }, res4);
  expect(res4.json).toHaveBeenCalled();

  // getMyOffers
  const res5 = mockRes();
  await roc.getMyOffers({ user: { id: 3 } }, res5);
  expect(res5.json).toHaveBeenCalled();

  // getClientOffers
  const res6 = mockRes();
  await roc.getClientOffers({ user: { id: 3 } }, res6);
  expect(res6.json).toHaveBeenCalled();

  // getOfferDetail not found
  const res7 = mockRes();
  await roc.getOfferDetail({ params: { offerId: 'nf' } }, res7);
  expect(res7.status).toHaveBeenCalledWith(404);

  // updateOfferStatus invalid status
  const res8 = mockRes();
  await roc.updateOfferStatus({ params: { offerId: '1' }, body: { status: 'bogus' }, user: { id: 42 }, app: { get: () => null } }, res8);
  expect(res8.status).toHaveBeenCalledWith(400);

  // updateOfferStatus offer not found
  const res9 = mockRes();
  // ensure getOfferById returns null
  const offerM = require('../models/repairOfferModel');
  offerM.getOfferById.mockResolvedValueOnce(null);
  await roc.updateOfferStatus({ params: { offerId: 'x' }, body: { status: 'accepted' }, user: { id: 42 }, app: { get: () => null } }, res9);
  expect(res9.status).toHaveBeenCalledWith(404);
});
