const db = require('../config/db');
const model = require('../models/repairOfferModel');

jest.mock('../config/db', () => ({ query: jest.fn() }));

describe('repairOfferModel', () => {
  beforeEach(async () => {
    db.query.mockReset();
    // Nettoyage des offres de réparation de test
    const dbReal = require('../config/db');
    if (dbReal && dbReal.query) {
      await dbReal.query('DELETE FROM repair_offers WHERE repair_request_id = $1 OR repairer_id = $2', [2, 3]);
    }
  });

  test('createRepairOffer returns inserted row', async () => {
    const fakeRow = { id: 1, repair_request_id: 2, repairer_id: 3 };
    db.query.mockResolvedValueOnce({ rows: [fakeRow] }); // format garanti

    const res = await model.createRepairOffer(2, 3, 50, 2, 'msg');
    expect(db.query).toHaveBeenCalled();
    expect(res).toEqual(fakeRow);
  });

  test('getOfferById returns single offer', async () => {
    const fake = { id: 5, repairer_name: 'R' };
    db.query.mockResolvedValueOnce({ rows: [fake] });
    const out = await model.getOfferById(5);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [5]);
    expect(out).toEqual(fake);
  });

  test('hasExistingOffer returns true when rows exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const v = await model.hasExistingOffer(10, 2);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [10, 2]);
    expect(v).toBe(true);
  });

  test('hasExistingOffer returns false when no rows', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const v = await model.hasExistingOffer(11, 4);
    expect(v).toBe(false);
  });
});
