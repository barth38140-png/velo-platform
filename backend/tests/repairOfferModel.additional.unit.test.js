const db = require('../config/db');
const model = require('../models/repairOfferModel');

jest.mock('../config/db', () => ({ query: jest.fn() }));

describe('repairOfferModel additional coverage', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  test('getOffersByRepairRequest returns array of rows', async () => {
    const rows = [{ id: 1, repair_request_id: 2 }, { id: 2, repair_request_id: 2 }];
    db.query.mockResolvedValueOnce({ rows });
    const out = await model.getOffersByRepairRequest(2);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [2]);
    expect(out).toEqual(rows);
  });

  test('getOffersByRepairer returns rows with mapping fields', async () => {
    const rows = [{ id: 5, repairer_id: 9, price: 100 }];
    db.query.mockResolvedValueOnce({ rows });
    const out = await model.getOffersByRepairer(9);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [9]);
    expect(out).toEqual(rows);
  });

  test('getOffersByClient returns rows for client', async () => {
    const rows = [{ id: 7, repairer_name: 'R' }];
    db.query.mockResolvedValueOnce({ rows });
    const out = await model.getOffersByClient(4);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [4]);
    expect(out).toEqual(rows);
  });

  test('updateOfferStatus returns updated offer', async () => {
    const updated = { id: 11, status: 'accepted' };
    db.query.mockResolvedValueOnce({ rows: [updated] });
    const out = await model.updateOfferStatus(11, 'accepted');
    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['accepted', 11]);
    expect(out).toEqual(updated);
  });
});
