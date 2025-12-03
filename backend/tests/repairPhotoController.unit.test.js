const { uploadPhotosHandler, getPhotoHandler } = require('../controllers/repairPhotoController');
const pool = require('../config/db');
const fs = require('fs');

jest.mock('../config/db', () => ({ query: jest.fn() }));

describe('repairPhotoController', () => {
  let req, res;
  beforeEach(() => {
    jest.resetAllMocks();
    req = { params: {}, user: { id: 5 }, files: [], app: { get: () => null } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn(), sendFile: jest.fn() };
  });

  test('uploadPhotosHandler returns 400 when no files', async () => {
    req.files = [];
    await uploadPhotosHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('uploadPhotosHandler returns 404 when repair not found', async () => {
    req.files = [{ path: 'uploads/a.jpg', originalname: 'a.jpg' }];
    pool.query.mockResolvedValueOnce({ rows: [] });
    req.params = { requestId: 10 };
    await uploadPhotosHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('uploadPhotosHandler returns 403 when not owner', async () => {
    req.files = [{ path: 'uploads/a.jpg', originalname: 'a.jpg' }];
    pool.query.mockResolvedValueOnce({ rows: [{ id: 10, user_id: 999 }] });
    req.params = { requestId: 10 };
    await uploadPhotosHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('uploadPhotosHandler inserts photos and returns them', async () => {
    req.files = [{ path: 'uploads/a.jpg', originalname: 'a.jpg' }];
    pool.query.mockResolvedValueOnce({ rows: [{ id: 20, user_id: 5 }] }); // repair exists
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, filename: 'a.jpg' }] }); // insert result
    req.params = { requestId: 20 };
    await uploadPhotosHandler(req, res);
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, photos: expect.any(Array) }));
  });

  describe('getPhotoHandler', () => {
    test('returns 404 when photo not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      req.params = { photoId: 99 };
      await getPhotoHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('owner can get file via sendFile', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, filepath: 'uploads/a.jpg', owner_id: 5, assigned_repairer_id: null, status: 'assigned' }] });
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      req.params = { photoId: 1 };
      await getPhotoHandler(req, res);
      expect(res.sendFile).toHaveBeenCalled();
      fs.existsSync.mockRestore();
    });

    test('pending + repairer role can preview', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 2, filepath: 'uploads/b.jpg', owner_id: 100, assigned_repairer_id: null, status: 'pending' }] });
      // role lookup
      pool.query.mockResolvedValueOnce({ rows: [{ role: 'repairer' }] });
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      req.params = { photoId: 2 };
      req.user = { id: 50 };
      await getPhotoHandler(req, res);
      expect(res.sendFile).toHaveBeenCalled();
      fs.existsSync.mockRestore();
    });

    test('not authorized returns 403', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 3, filepath: 'uploads/c.jpg', owner_id: 1, assigned_repairer_id: null, status: 'assigned' }] });
      req.params = { photoId: 3 };
      req.user = { id: 999 };
      await getPhotoHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
