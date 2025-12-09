/* tests/routes.bookings.route.unit.test.js */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../src/db');
const { Client } = require('pg');

// Suppression de la variable inutilisée 'JWT_SECRET' pour lint clean
let TEST_LISTING_ID = 999001;
let TEST_USER_ID = 999002;

jest.setTimeout(30000);

beforeEach(async () => {
  // Use a dedicated client for setup so we can guarantee close() and avoid open handles
  const client = new Client({
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.PGDATABASE || process.env.DB_NAME || 'velo_platform'
  });
  try {
    await client.connect();
    // ensure bookings table exists locally for tests that create rows directly
    try {
      await client.query('CREATE TABLE IF NOT EXISTS bookings (id SERIAL PRIMARY KEY, listing_id INTEGER, client_id INTEGER, start_date DATE, end_date DATE, status VARCHAR(30), scheduled_from TIMESTAMP, scheduled_to TIMESTAMP)');
    } catch { /* ignore */ }
    // Clean up any leftover test bookings
    try {
      await client.query("DELETE FROM bookings WHERE listing_id >= 999000");
    } catch { /* ignore */ }

    // Ensure a test user exists (insert with ON CONFLICT)
    try {
      await client.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`, [TEST_USER_ID, 'it_user_seed3@example.com', '$2b$10$hash', 'client']);
    } catch {
      // If users table doesn't match, ignore and try to select an existing user below
    }

    // Ensure a listing exists that satisfies FK constraints: try to insert with explicit owner_id
    try {
      await client.query(`INSERT INTO listings (id, owner_id, title, repairer_id) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`, [TEST_LISTING_ID, TEST_USER_ID, 'Test Listing', null]);
    } catch {
      // If insert fails due to schema mismatch (different columns/constraints), ignore
    }

    // If the expected listing/user were not created, fall back to picking existing ids
    try {
      const r = await client.query('SELECT id FROM listings LIMIT 1');
      if (r && r.rowCount > 0) TEST_LISTING_ID = r.rows[0].id;
    } catch { /* ignore */ }
    try {
      const ru = await client.query('SELECT id FROM users LIMIT 1');
      if (ru && ru.rowCount > 0) TEST_USER_ID = ru.rows[0].id;
    } catch { /* ignore */ }
  } finally {
    try { await client.end(); } catch { /* ignore */ }
  }
});

test('GET /bookings/:id returns 200 when booking exists', async () => {
  // ensure the selected listing actually exists; if not, try creating a minimal listing row
  try {
    const exists = await db.query('SELECT 1 FROM listings WHERE id = $1', [TEST_LISTING_ID]);
    if (!exists || exists.rowCount === 0) {
      try {
        const newL = await db.query('INSERT INTO listings DEFAULT VALUES RETURNING id');
        if (newL && newL.rowCount > 0) TEST_LISTING_ID = newL.rows[0].id;
      } catch {
        // ignore creating default listing
      }
    }
  } catch {
    // ignore
  }
  const insert = await db.query('INSERT INTO bookings (listing_id, client_id, start_date, end_date, status) VALUES ($1,$2,$3,$4,$5) RETURNING *', [TEST_LISTING_ID, TEST_USER_ID, '2025-01-01', '2025-01-02', 'pending']);
  const booking = insert.rows[0];
  const { app } = require('../src/index');
  const token = jwt.sign({ id: TEST_USER_ID, email: 'it_user_seed3@example.com' }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '1h' });
  const res = await request(app).get(`/bookings/${booking.id}`).set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('id', booking.id);
});

test('GET /bookings/:id returns 404 when booking does not exist', async () => {
  const { app } = require('../src/index');
  const token = jwt.sign({ id: TEST_USER_ID, email: 'it_user_seed3@example.com' }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '1h' });
  const res = await request(app).get('/bookings/99999999').set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(404);
  expect(res.body).toHaveProperty('error', 'not_found');
});

afterAll(async () => {
  // Close shared pool to avoid Jest open-handle warnings when running this file directly
  try {
    if (db && db.pool && typeof db.pool.end === 'function') await db.pool.end();
  } catch {
    // ignore
  }
});
