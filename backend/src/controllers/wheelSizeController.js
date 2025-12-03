const db = require('../db');
const logger = require('../logger');
const { logAdminAction } = require('../audit');

async function ensureTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS wheel_sizes (
        id SERIAL PRIMARY KEY,
        size TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_wheel_sizes_lower') THEN
          CREATE UNIQUE INDEX uniq_wheel_sizes_lower ON wheel_sizes ((LOWER(size)));
        END IF;
      END $$; 
    `);
  } catch (e) {
    logger.error({ err: e }, '[wheel-sizes] failed to ensure table');
  }
}

function normalizeSize(str) {
  const s = String(str || '').trim();
  if (!s) return '';
  // Convert trailing 'c' to uppercase (700c -> 700C), keep quotes and decimals
  return s.replace(/([0-9]+)c\b/i, (m, num) => `${num}C`).replace(/([a-z]+)/gi, t => t.length <= 3 ? t.toUpperCase() : t);
}

exports.getWheelSizes = async (req, res) => {
  try {
    await ensureTable();
    const r = await db.query('SELECT size FROM wheel_sizes ORDER BY size ASC');
    const defaults = ['700C','29"','27.5"','650B','26"','24"','20"'];
    const sizes = Array.from(new Set([...defaults, ...r.rows.map(x => x.size)]));
    res.json({ sizes });
  } catch (e) {
    logger.error({ err: e }, '[wheel-sizes] getWheelSizes error');
    res.status(500).json({ error: 'failed_to_fetch_wheel_sizes' });
  }
};

exports.addWheelSize = async (req, res) => {
  try {
    const { size } = req.body || {};
    if (!size || typeof size !== 'string' || !size.trim()) {
      return res.status(400).json({ error: 'invalid_wheel_size' });
    }
    await ensureTable();
    const norm = normalizeSize(size);
    await db.query('INSERT INTO wheel_sizes (size) VALUES ($1) ON CONFLICT ((LOWER(size))) DO NOTHING', [norm]);
    res.json({ ok: true, size: norm });
  } catch (e) {
    logger.error({ err: e }, '[wheel-sizes] addWheelSize error');
    res.status(500).json({ error: 'failed_to_add_wheel_size' });
  }
};

exports.seedWheelSizes = async (req, res) => {
  try {
    await ensureTable();
    const seeds = Array.isArray(req.body && req.body.sizes) ? req.body.sizes : ['700C','29"','27.5"','650B','26"','24"','20"'];
    let inserted = 0;
    for (const raw of seeds) {
      const norm = normalizeSize(raw);
      if (!norm) continue;
      const r = await db.query('INSERT INTO wheel_sizes (size) VALUES ($1) ON CONFLICT ((LOWER(size))) DO NOTHING RETURNING id', [norm]);
      if (r.rowCount === 1) inserted++;
    }
    const userId = req.user && req.user.id;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAdminAction(userId, 'seed_wheel_sizes', { total: seeds.length, inserted }, ipAddress);
    res.json({ ok: true, total: seeds.length, inserted });
  } catch (e) {
    logger.error({ err: e }, '[wheel-sizes] seedWheelSizes error');
    res.status(500).json({ error: 'failed_to_seed_wheel_sizes' });
  }
};
