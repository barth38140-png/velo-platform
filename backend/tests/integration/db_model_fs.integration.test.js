const path = require('path');
const fs = require('fs');
const pool = require('../../config/db');
const repairModel = require('../../models/repairModel');
const repairPhotoController = require('../../controllers/repairPhotoController');

describe('Integration: DB <-> Model <-> FS', () => {
  let userId;
  let request;
  let photoRow;
  let createdUserByTest = false;
  const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');

  beforeAll(async () => {
    // ensure uploads dir exists
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // try to find or create a user dynamically by inspecting the users table schema
    try {
      const exists = await pool.query("SELECT to_regclass('public.users') AS exists");
      if (!exists || !exists.rows || !exists.rows[0] || !exists.rows[0].exists) {
        console.warn('Integration test: users table not found; skipping integration test');
        return;
      }

      const colsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
      const cols = (colsRes.rows || []).map(r => r.column_name);

      // If there is at least one row, try to pick an existing user first
      try {
        const existing = await pool.query('SELECT id FROM users LIMIT 1');
        if (existing && existing.rows && existing.rows[0]) {
          userId = existing.rows[0].id;
          return;
        }
      } catch (e) {
        // ignore - we'll try to insert
      }

      // Build insert dynamically based on available columns
      const preferred = ['username', 'email', 'password_hash', 'role'];
      const available = preferred.filter(c => cols.includes(c));
      if (available.length === 0) {
        console.warn('Integration test: users table exists but no known columns to insert; skipping');
        return;
      }

      const values = [];
      const placeholders = [];
      const now = Date.now();
      available.forEach((c, i) => {
        placeholders.push(`$${i + 1}`);
        if (c === 'username') values.push(`it_user_${now}`);
        else if (c === 'email') values.push(`it_${now}@example.com`);
        else if (c === 'password_hash') values.push('hash');
        else if (c === 'role') values.push('user');
        else values.push(null);
      });

      const sql = `INSERT INTO users (${available.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`;
      const inserted = await pool.query(sql, values);
      if (inserted && inserted.rows && inserted.rows[0]) {
        userId = inserted.rows[0].id;
        createdUserByTest = true;
      }
    } catch (e) {
      console.warn('Integration test: could not prepare user (skipping):', e && e.message ? e.message : e);
    }
  });

  test('create repair request, attach photo file and DB record, then retrieve via model and controller', async () => {
    if (!userId) {
      // Skip if no user available in DB
      // eslint-disable-next-line no-console
      console.warn('Skipping integration assertions because no userId is available');
      return;
    }

    // create repair request via model
    request = await repairModel.createRepairRequest(userId, 'IT Title', 'IT Description');
    expect(request).toHaveProperty('id');

    // create dummy file
    const filename = `it-${Date.now()}.txt`;
    const absPath = path.join(uploadsDir, filename);
    fs.writeFileSync(absPath, 'integration test file');

    // insert photo record pointing to relative uploads path
    const relPath = path.join('uploads', filename).replace(/\\/g, '/');
    const pr = await pool.query(
      'INSERT INTO repair_request_photos (repair_request_id, filename, filepath) VALUES ($1,$2,$3) RETURNING *',
      [request.id, filename, relPath]
    );
    photoRow = pr.rows[0];

    // fetch via model
    const fetched = await repairModel.getRepairRequestById(request.id);
    expect(fetched).not.toBeNull();
    expect(Array.isArray(fetched.photos)).toBe(true);
    expect(fetched.photos.find(p => p.id === photoRow.id)).toBeTruthy();

    // call controller getPhotoHandler with owner user
    const req = { params: { photoId: String(photoRow.id) }, user: { id: userId } };
    const res = { sendFile: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await repairPhotoController.getPhotoHandler(req, res);
    expect(res.sendFile).toHaveBeenCalled();
  });

  afterAll(async () => {
    try {
      if (photoRow && photoRow.id) await pool.query('DELETE FROM repair_request_photos WHERE id = $1', [photoRow.id]);
      if (request && request.id) await pool.query('DELETE FROM repair_requests WHERE id = $1', [request.id]);
      if (createdUserByTest && userId) await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      // remove file
      if (photoRow && photoRow.filepath) {
        const absolute = path.resolve(__dirname, '..', '..', photoRow.filepath);
        if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
      }
    } catch (e) {
      // ignore cleanup errors
      // eslint-disable-next-line no-console
      console.error('cleanup error', e && e.stack ? e.stack : e);
    }
    try {
      if (pool && typeof pool.end === 'function') await pool.end();
    } catch (e) {
      // ignore pool shutdown errors
    }
  });
});
