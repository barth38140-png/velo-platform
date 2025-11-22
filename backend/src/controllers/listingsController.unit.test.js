const db = require('../db');
jest.mock('../db', () => ({ query: jest.fn() }));
const listingsController = require('./listingsController');

describe('listingsController', () => {
  let req, res;
  beforeEach(() => {
    req = { body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('createListing', () => {
    it('should create a listing and return 201', async () => {
      req.body = { repairer_id: 1, title: 'Test', description: 'desc', price: 10, duration_min: 30 };
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, title: 'Test' }] });
      await listingsController.createListing(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1, title: 'Test' });
    });

    it('should return 400 if missing fields', async () => {
      req.body = { title: '', description: '', price: null };
      await listingsController.createListing(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });

    it('should return 500 on db error', async () => {
      req.body = { repairer_id: 1, title: 'Test', description: 'desc', price: 10, duration_min: 30 };
      db.query.mockRejectedValueOnce(new Error('fail'));
      await listingsController.createListing(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'internal_error' });
    });
  });

  describe('getListings', () => {
    it('should return listings', async () => {
      req.query = {};
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, title: 'A' }] });
      await listingsController.getListings(req, res);
      expect(res.json).toHaveBeenCalledWith([{ id: 1, title: 'A' }]);
    });

    it('should return 500 on db error', async () => {
      req.query = {};
      db.query.mockRejectedValueOnce(new Error('fail'));
      await listingsController.getListings(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'internal_error' });
    });
  });
});