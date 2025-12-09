const db = require('../config/db');
const model = require('../models/repairModel');

jest.mock('../config/db', () => ({ query: jest.fn() }));

describe('repairModel', () => {
  beforeEach(async () => {
    db.query.mockReset();
    // Nettoyage des demandes de réparation de test
    const dbReal = require('../config/db');
    if (dbReal && dbReal.query) {
      await dbReal.query('DELETE FROM repair_requests WHERE title = $1', ['Fix bike']);
    }
  });

  test('createRepairRequest returns created row', async () => {
    const fake = { id: 42, title: 'Fix bike' };
    db.query.mockResolvedValueOnce({ rows: [fake] }); // format garanti
    const out = await model.createRepairRequest(1, 'Fix bike', 'desc');
    expect(db.query).toHaveBeenCalled();
    expect(out).toEqual(fake);
  });

  test('getRepairRequestById returns null when not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // first call finds repair
    const out = await model.getRepairRequestById(999);
    expect(out).toBeNull();
  });

  test('getRepairRequestById attaches photos when present', async () => {
    const repair = { id: 7, title: 'A' };
    const photos = [{ id: 1, filename: 'p.jpg' }];
    // first query returns repair
    db.query.mockResolvedValueOnce({ rows: [repair] });
    // second query returns photos
    db.query.mockResolvedValueOnce({ rows: photos });
    const out = await model.getRepairRequestById(7);
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(out.photos).toEqual(photos);
  });

  test('updateRepairRequestStatus returns updated row', async () => {
    const updated = { id: 8, status: 'accepted' };
    db.query.mockResolvedValueOnce({ rows: [updated] });
    const out = await model.updateRepairRequestStatus(8, 'accepted', 3);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['accepted', 3, 8]);
    expect(out).toEqual(updated);
  });
});
