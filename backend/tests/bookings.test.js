/* tests/bookings.test.js */
// Improve error visibility during CI/debugging
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED_REJECTION in bookings.test:', reason && (reason.stack || reason));
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT_EXCEPTION in bookings.test:', err && (err.stack || err));
});
const request = require("supertest");
const { start, stop } = require("../src/index");
const { Client } = require("pg");
// Load environment variables from `.env` when DB connection details are not provided externally.
if (!process.env.DATABASE_URL && !process.env.PGHOST && !process.env.DB_HOST) {
  require('dotenv').config();
}

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const TEST_USER = { id: 10001, email: "test@example.com", role: "user" };
const TEST_TOKEN = jwt.sign(TEST_USER, JWT_SECRET, { expiresIn: '1h' });

const TEST_PORT = process.env.TEST_PORT ? Number(process.env.TEST_PORT) : 3010;
const BASE_URL = `http://localhost:${TEST_PORT}`;
const BOOKING_PAYLOAD = {
  listing_id: 20001,
  client_id: 10001,
  start_date: "2025-12-01T10:00:00.000Z",
  end_date: "2025-12-01T11:00:00.000Z"
};

async function withClient(fn) {
  const client = process.env.DATABASE_URL
    ? new Client({ connectionString: process.env.DATABASE_URL })
    : new Client({
        host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
        port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
        user: process.env.PGUSER || process.env.DB_USER || 'postgres',
        password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.PGDATABASE || process.env.DB_NAME || 'velo_platform_test'
      });

  console.log('[withClient] connecting with', {
    host: client.host || process.env.PGHOST || process.env.DB_HOST,
    port: client.port || process.env.PGPORT || process.env.DB_PORT,
    user: client.user || process.env.PGUSER || process.env.DB_USER,
    database: client.database || process.env.PGDATABASE || process.env.DB_NAME
  });
  try {
    await client.connect();
  } catch (err) {
    console.error('[withClient] connect error:', err && (err.stack || err.message || err));
    throw err;
  }
  // ensure tests always use public schema to avoid ambiguous resolution
  await client.query("SET search_path TO public");

  // ...existing code...

  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
async function seedTestData() {
  await withClient(async (c) => {
    // Supprime explicitement les utilisateurs test par email pour éviter les doublons
    await c.query(`DELETE FROM users WHERE email IN ('test@example.com', 'repairer@example.com');`);
    // Ajoute l'utilisateur test (id 10001)
    await c.query(`
      INSERT INTO users (id, email, password_hash, role)
      VALUES (10001, 'test@example.com', '$2b$10$testhash', 'client')
      ON CONFLICT (id) DO NOTHING;
    `);
    // Ajoute un réparateur fictif (id 10002)
    await c.query(`
      INSERT INTO users (id, email, password_hash, role)
      VALUES (10002, 'repairer@example.com', '$2b$10$testhash', 'repairer')
      ON CONFLICT (id) DO NOTHING;
    `);
    // Ajoute le réparateur dans la table repairers
    await c.query(`
      INSERT INTO repairers (id, user_id)
      VALUES (10002, 10002)
      ON CONFLICT (id) DO NOTHING;
    `);
    // Ajoute la listing de test avec un réparateur valide
    await c.query(`
      INSERT INTO listings (id, owner_id, title, repairer_id)
      VALUES (20001, 10001, 'Test Listing', 10002)
      ON CONFLICT (id) DO NOTHING;
    `);
  });
}

async function waitForDb(retries = 10, delay = 500) {
  const { Client } = require('pg');
  for (let i = 0; i < retries; i++) {
    try {
      const client = process.env.DATABASE_URL
        ? new Client({ connectionString: process.env.DATABASE_URL })
        : new Client({
            host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
            port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
            user: process.env.PGUSER || process.env.DB_USER || 'postgres',
            password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
            database: process.env.PGDATABASE || process.env.DB_NAME || 'velo_platform_test'
          });
      await client.connect();
      await client.end();
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      // small delay then retry
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function teardownTestData() {
  await withClient(async (c) => {
    // Supprime les offres de réparation liées
    try {
      await c.query(`DELETE FROM repair_offers WHERE repairer_id = 10002 OR repair_request_id IN (SELECT id FROM repair_requests WHERE client_id = 10001);`);
    } catch (err) {
      if (err.message && err.message.includes('client_id')) {
        await c.query(`DELETE FROM repair_offers WHERE repairer_id = 10002 OR repair_request_id IN (SELECT id FROM repair_requests WHERE user_id = 10001);`);
      } else {
        throw err;
      }
    }
    // Supprime les demandes de réparation liées
    try {
      await c.query(`DELETE FROM repair_requests WHERE client_id = 10001;`);
    } catch (err) {
      if (err.message && err.message.includes('client_id')) {
        await c.query(`DELETE FROM repair_requests WHERE user_id = 10001;`);
      } else {
        throw err;
      }
    }
    // Supprime les bookings liés à l'utilisateur (client ou réparateur)
    try {
      await c.query(`DELETE FROM bookings WHERE client_id = 10001 OR repairer_id = 10002;`);
    } catch (err) {
      if (err.message && err.message.includes('client_id')) {
        await c.query(`DELETE FROM bookings WHERE user_id = 10001 OR repairer_id = 10002;`);
      } else {
        throw err;
      }
    }
    // Supprime les reviews éventuelles
    try {
      await c.query("DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='reviews') THEN EXECUTE 'DELETE FROM reviews WHERE client_id = 10001 OR repairer_id = 10002 OR booking_id IN (SELECT id FROM bookings WHERE client_id = 10001 OR repairer_id = 10002)'; END IF; END $$;");
    } catch {
      await c.query("DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='reviews') THEN EXECUTE 'DELETE FROM reviews WHERE user_id = 10001 OR repairer_id = 10002 OR booking_id IN (SELECT id FROM bookings WHERE user_id = 10001 OR repairer_id = 10002)'; END IF; END $$;");
    }
    // Supprime la listing de test
    await c.query(`DELETE FROM listings WHERE id = 20001;`);
    // Supprime le réparateur dans la table repairers
    await c.query(`DELETE FROM repairers WHERE id = 10002 OR user_id = 10002;`);
    // Supprime les utilisateurs test et réparateur par id et email
    await c.query(`DELETE FROM users WHERE id IN (10001, 10002) OR email IN ('test@example.com', 'repairer@example.com');`);
  });
}

beforeAll(async () => {
  try {
    // assure environment variables are loaded
    // wait for the DB to be ready, seed DB and start server
    await waitForDb(20, 500);
    await seedTestData();
    await start(TEST_PORT);
  } catch (err) {
    console.error('beforeAll ERROR in bookings.test:', err && (err.stack || err));
    throw err;
  }
}, 20000);

afterAll(async () => {
  // stop server (teardown désactivé temporairement pour debug persistance)
  await stop();
  await teardownTestData();
}, 20000);
  beforeEach(async () => {
    await teardownTestData();
    await seedTestData();
  });

test("POST /bookings creates booking and is idempotent", async () => {
  // first create
  const res1 = await request(BASE_URL)
    .post("/bookings")
    .send(BOOKING_PAYLOAD)
    .set("Accept", "application/json")
    .set("Authorization", `Bearer ${TEST_TOKEN}`);
  if (![200,201].includes(res1.status)) console.error('DEBUG res1 body:', res1.body);
  expect([200,201]).toContain(res1.status);
  expect(res1.body.success).toBe(true);
  expect(res1.body.booking).toBeDefined();
  const firstId = res1.body.booking.id;
  expect(firstId).toBeDefined();

  // second create with same payload should return same id (idempotence)
  const res2 = await request(BASE_URL)
    .post("/bookings")
    .send(BOOKING_PAYLOAD)
    .set("Accept", "application/json")
    .set("Authorization", `Bearer ${TEST_TOKEN}`);
  expect([200,201]).toContain(res2.status);
  expect(res2.body.success).toBe(true);
  expect(res2.body.booking).toBeDefined();
  const secondId = res2.body.booking.id;
  expect(secondId).toBeDefined();
  expect(secondId).toEqual(firstId);

  // verify GET returns the booking
  const getRes = await request(BASE_URL)
    .get(`/bookings/${firstId}`)
    .set("Accept", "application/json")
    .set("Authorization", `Bearer ${TEST_TOKEN}`);
  expect(getRes.status).toBe(200);
  expect(getRes.body.success).toBe(true);
  expect(getRes.body.booking).toMatchObject({
    id: firstId,
    listing_id: 20001,
    client_id: 10001
  }); // ignore dates (fuseau horaire)
  // teardown n'est PAS appelé ici, il reste dans afterAll
}, 20000);









