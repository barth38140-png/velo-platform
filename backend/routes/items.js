const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const pool = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || "demo",
  password: process.env.DB_PASS || "demo",
  database: process.env.DB_NAME || "demo"
});

// GET /api/items
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, name FROM items ORDER BY id LIMIT 100");
    return res.json(rows);
  } catch (e) {
    console.error("GET /api/items error:", e.message);
    return res.json([{ id: 1, name: "Demo item (fallback)" }]);
  }
});

// POST /api/items
router.post("/", async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO items(name) VALUES($1) ON CONFLICT(name) DO NOTHING RETURNING id, name",
      [name]
    );
    if (rows.length === 0) return res.status(409).json({ error: "duplicate" });
    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error("POST /api/items error:", e.message);
    return res.status(500).json({ error: "db error" });
  }
});

module.exports = router;
