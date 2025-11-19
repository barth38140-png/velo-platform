/* tests/bookings.test.js */
const request = require("supertest");
const { start, stop } = require("../src/index");
const { Client } = require("pg");
require('dotenv').config({ path: '.env.test' });

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
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE
      });

  await client.connect();
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
    // Ajoute l'utilisateur test (id 10001)
    await c.query(`
      INSERT INTO users (id, email, password_hash, role)
      VALUES (10001, 'test@example.com', '$2b$10$testhash', 'client')
      ON CONFLICT (id) DO NOTHING;
    `);
    // Ajoute la listing de test
    await c.query(`
      INSERT INTO listings (id, owner_id, title, repairer_id)
      VALUES (20001, 10001, 'Test Listing', NULL)
      ON CONFLICT (id) DO NOTHING;
    `);
  });
}

async function teardownTestData() {
  await withClient(async (c) => {
    // Supprime d'abord les bookings liés à l'utilisateur et à la listing
    await c.query(`DELETE FROM bookings WHERE listing_id = 20001 OR client_id = 10001;`);
    // Supprime les reviews éventuelles
    await c.query("DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='reviews') THEN EXECUTE 'DELETE FROM reviews WHERE listing_id = 20001 OR author_id = 10001'; END IF; END $$;");
    // Supprime la listing de test
    await c.query(`DELETE FROM listings WHERE id = 20001;`);
    // Supprime l'utilisateur test
    await c.query(`DELETE FROM users WHERE id = 10001;`);
  });
}

beforeAll(async () => {
  // assure .env.test is loaded
  // seed DB and start server
  await seedTestData();
  await start(TEST_PORT);
}, 20000);

afterAll(async () => {
  // stop server (teardown désactivé temporairement pour debug persistance)
  await stop();
  await teardownTestData();
}, 20000);

test("POST /bookings creates booking and is idempotent", async () => {
  // first create
  const res1 = await request(BASE_URL)
    .post("/bookings")
    .send(BOOKING_PAYLOAD)
    .set("Accept", "application/json")
    .set("Authorization", `Bearer ${TEST_TOKEN}`);
  // ...existing code...
  expect([200,201]).toContain(res1.status);
  expect(res1.body).toBeDefined();
  const firstId = res1.body.bookingId || res1.body.id;
  expect(firstId).toBeDefined();

  // second create with same payload should return same id (idempotence)
  const res2 = await request(BASE_URL)
    .post("/bookings")
    .send(BOOKING_PAYLOAD)
    .set("Accept", "application/json")
    .set("Authorization", `Bearer ${TEST_TOKEN}`);
  expect([200,201]).toContain(res2.status);
  const secondId = res2.body.bookingId || res2.body.id;
  expect(secondId).toBeDefined();
  expect(secondId).toEqual(firstId);

  // verify GET returns the booking
  const getRes = await request(BASE_URL)
    .get(`/bookings/${firstId}`)
    .set("Accept", "application/json")
    .set("Authorization", `Bearer ${TEST_TOKEN}`);
  expect(getRes.status).toBe(200);
  expect(getRes.body).toMatchObject({
    id: firstId,
    listing_id: 20001,
    client_id: 10001
  }); // ignore dates (fuseau horaire)
  // teardown n'est PAS appelé ici, il reste dans afterAll
}, 20000);









