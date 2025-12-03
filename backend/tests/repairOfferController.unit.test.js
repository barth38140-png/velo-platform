const repairOfferController = require('../controllers/repairOfferController');
const repairOfferModel = require('../models/repairOfferModel');
const repairModel = require('../models/repairModel');

jest.mock('../models/repairOfferModel');
jest.mock('../models/repairModel');

describe('repairOfferController', () => {
  let req, res, next;
  beforeEach(() => {
    jest.resetAllMocks();
    req = { body: {}, params: {}, user: { id: 10 }, app: { get: () => null } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() };
  });

  test('createOffer returns 400 when existing offer present', async () => {
    repairOfferModel.hasExistingOffer.mockResolvedValue(true);
    req.body = { repair_request_id: 1 };
    await repairOfferController.createOffer(req, res);
    expect(repairOfferModel.hasExistingOffer).toHaveBeenCalledWith(1, 10);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('createOffer returns 404 when repair not found', async () => {
    repairOfferModel.hasExistingOffer.mockResolvedValue(false);
    repairModel.getRepairRequestById.mockResolvedValue(null);
    req.body = { repair_request_id: 2 };
    await repairOfferController.createOffer(req, res);
    expect(repairModel.getRepairRequestById).toHaveBeenCalledWith(2);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('createOffer returns 201 on success', async () => {
    repairOfferModel.hasExistingOffer.mockResolvedValue(false);
    repairModel.getRepairRequestById.mockResolvedValue({ id: 3 });
    const fakeOffer = { id: 7 };
    repairOfferModel.createRepairOffer.mockResolvedValue(fakeOffer);
    req.body = { repair_request_id: 3, offered_price: 20, estimated_duration_hours: 2, message: 'hi' };
    await repairOfferController.createOffer(req, res);
    expect(repairOfferModel.createRepairOffer).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, offer: fakeOffer }));
  });

  test('createOffer handles unique constraint (23505) -> 409', async () => {
    repairOfferModel.hasExistingOffer.mockResolvedValue(false);
    repairModel.getRepairRequestById.mockResolvedValue({ id: 4 });
    const err = new Error('dup'); err.code = '23505';
    repairOfferModel.createRepairOffer.mockRejectedValue(err);
    req.body = { repair_request_id: 4 };
    await repairOfferController.createOffer(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('updateOfferStatus invalid status -> 400', async () => {
    req.params = { offerId: 1 };
    req.body = { status: 'badstatus' };
    await repairOfferController.updateOfferStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateOfferStatus not found -> 404', async () => {
    req.params = { offerId: 2 };
    req.body = { status: 'accepted' };
    repairOfferModel.getOfferById.mockResolvedValue(null);
    await repairOfferController.updateOfferStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateOfferStatus forbidden when not owner -> 403', async () => {
    req.params = { offerId: 3 };
    req.body = { status: 'accepted' };
    const offer = { id: 3, repair_request_id: 99, repairer_id: 20 };
    repairOfferModel.getOfferById.mockResolvedValue(offer);
    repairModel.getRepairRequestById.mockResolvedValue({ id: 99, user_id: 999 }); // owner is someone else
    await repairOfferController.updateOfferStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('updateOfferStatus accepts offer and emits socket events', async () => {
    req.params = { offerId: 4 };
    req.body = { status: 'accepted' };
    req.user = { id: 11 };
    const offer = { id: 4, repair_request_id: 100, repairer_id: 22 };
    repairOfferModel.getOfferById.mockResolvedValue(offer);
    repairModel.getRepairRequestById.mockResolvedValue({ id: 100, user_id: 11 });
    const updated = { id: 4, repairer_id: 22 };
    repairOfferModel.updateOfferStatus.mockResolvedValue(updated);
    repairModel.updateRepairRequestStatus.mockResolvedValue({ id: 100, status: 'assigned' });

    // mock io
    const emitMock = jest.fn();
    const io = { to: jest.fn().mockReturnValue({ emit: emitMock }) };
    req.app = { get: () => io };

    await repairOfferController.updateOfferStatus(req, res);
    expect(repairOfferModel.updateOfferStatus).toHaveBeenCalledWith(4, 'accepted');
    expect(repairModel.updateRepairRequestStatus).toHaveBeenCalledWith(100, 'assigned', 22);
    expect(io.to).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, offer: updated }));
  });
});
