const request = require('supertest');
const { start, stop } = require('../src/index');
const repairOfferModel = require('../models/repairOfferModel');
const repairModel = require('../models/repairModel');

jest.mock('../models/repairOfferModel');
jest.mock('../models/repairModel');

describe('Auto-reject concurrent offers', () => {
  let app;
  let server;

  beforeAll(async () => {
    server = await start(0);
    app = require('../src/index').app;
  });

  afterAll(async () => {
    await stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should auto-reject other offers when one is accepted', async () => {
    const mockOffer = {
      id: 1,
      repair_request_id: 100,
      repairer_id: 2,
      status: 'proposée'
    };

    const mockRepair = {
      id: 100,
      user_id: 1,
      status: 'en_attente'
    };

    const allMockOffers = [
      { id: 1, repair_request_id: 100, repairer_id: 2, status: 'proposée' },
      { id: 2, repair_request_id: 100, repairer_id: 3, status: 'proposée' },
      { id: 3, repair_request_id: 100, repairer_id: 4, status: 'proposée' }
    ];

    repairOfferModel.getOfferById.mockResolvedValue(mockOffer);
    repairModel.getRepairRequestById.mockResolvedValue(mockRepair);
    repairOfferModel.getOffersByRepairRequest.mockResolvedValue(allMockOffers);
    repairOfferModel.updateOfferStatus.mockImplementation((id, status) => 
      Promise.resolve({ ...allMockOffers.find(o => o.id === id), status })
    );
    repairModel.updateRepairRequestStatus.mockResolvedValue({ ...mockRepair, status: 'assignée' });

    const token = 'valid-test-token';
    // Mock l'utilisateur authentifié
    jest.spyOn(require('../middlewares/auth'), 'default').mockImplementation((req, res, next) => {
      req.user = { id: 1, role: 'client' };
      next();
    });

    const response = await request(app)
      .patch('/api/repair-offers/1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'acceptée' })
      .expect(200);

    expect(response.body.success).toBe(true);
    
    // Vérifier que updateOfferStatus a été appelé 3 fois:
    // 1x pour l'offre acceptée + 2x pour les auto-rejets
    expect(repairOfferModel.updateOfferStatus).toHaveBeenCalledTimes(3);
    
    // Vérifier l'appel pour l'offre acceptée
    expect(repairOfferModel.updateOfferStatus).toHaveBeenCalledWith(1, 'acceptée');
    
    // Vérifier les appels pour les auto-rejets
    expect(repairOfferModel.updateOfferStatus).toHaveBeenCalledWith(2, 'rejetée');
    expect(repairOfferModel.updateOfferStatus).toHaveBeenCalledWith(3, 'rejetée');
    
    // Vérifier la transition du statut de la demande
    expect(repairModel.updateRepairRequestStatus).toHaveBeenCalledWith(100, 'assignée', 2);
  });

  it('should not reject already accepted/rejected offers', async () => {
    const mockOffer = {
      id: 1,
      repair_request_id: 100,
      repairer_id: 2,
      status: 'proposée'
    };

    const mockRepair = {
      id: 100,
      user_id: 1,
      status: 'en_attente'
    };

    const allMockOffers = [
      { id: 1, repair_request_id: 100, repairer_id: 2, status: 'proposée' },
      { id: 2, repair_request_id: 100, repairer_id: 3, status: 'rejetée' }, // Déjà rejetée
      { id: 3, repair_request_id: 100, repairer_id: 4, status: 'annulée' } // Annulée
    ];

    repairOfferModel.getOfferById.mockResolvedValue(mockOffer);
    repairModel.getRepairRequestById.mockResolvedValue(mockRepair);
    repairOfferModel.getOffersByRepairRequest.mockResolvedValue(allMockOffers);
    repairOfferModel.updateOfferStatus.mockImplementation((id, status) => 
      Promise.resolve({ ...allMockOffers.find(o => o.id === id), status })
    );
    repairModel.updateRepairRequestStatus.mockResolvedValue({ ...mockRepair, status: 'assignée' });

    jest.spyOn(require('../middlewares/auth'), 'default').mockImplementation((req, res, next) => {
      req.user = { id: 1, role: 'client' };
      next();
    });

    await request(app)
      .patch('/api/repair-offers/1/status')
      .set('Authorization', 'Bearer token')
      .send({ status: 'acceptée' })
      .expect(200);

    // Seulement l'offre acceptée doit être mise à jour (les autres ne sont pas 'proposée')
    expect(repairOfferModel.updateOfferStatus).toHaveBeenCalledTimes(1);
    expect(repairOfferModel.updateOfferStatus).toHaveBeenCalledWith(1, 'acceptée');
  });
});
