const db = require('../db');
const logger = require('../logger');
const { logAdminAction } = require('../audit');

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS brands (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `);
  // Add a case-insensitive unique index to prevent duplicates differing by case
  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_brands_lower_name'
      ) THEN
        CREATE UNIQUE INDEX uniq_brands_lower_name ON brands ((LOWER(name)));
      END IF;
    END $$;
  `);
}

exports.getBrands = async (req, res) => {
  try {
    await ensureTable();
    const result = await db.query('SELECT name FROM brands ORDER BY name ASC');
    const names = result.rows.map(r => r.name);
    // fallback defaults merged for robustness
    const defaults = ['Trek','Specialized','Giant','Cannondale','Decathlon'];
    const merged = Array.from(new Set([...(defaults), ...names]));
    res.json({ brands: merged });
  } catch (e) {
    logger.error({ err: e }, '[brands] getBrands error');
    res.status(500).json({ error: 'failed_to_fetch_brands' });
  }
};

function toTitleCase(str) {
  return String(str || '')
    .split(/\s+/)
    .map(tok => {
      const t = tok.trim();
      if (!t) return '';
      // Preserve common acronyms (e.g., BMC, GT). Keep all-caps tokens of length <= 3.
      if (t.length <= 3 && /^[A-Z0-9]+$/.test(t)) return t.toUpperCase();
      // Handle hyphenated words: e.g., "rock-rider" -> "Rock-Rider"
      return t.toLowerCase().split('-').map(p => p ? (p[0].toUpperCase() + p.slice(1)) : p).join('-');
    })
    .join(' ');
}

exports.addBrand = async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'invalid_brand_name' });
    }
    await ensureTable();
    const trimmed = toTitleCase(name.trim());
    // Normalize spacing; store canonical case but enforce uniqueness by LOWER(name)
    await db.query('INSERT INTO brands (name) VALUES ($1) ON CONFLICT (lower(name)) DO NOTHING', [trimmed]);
    res.json({ ok: true, name: trimmed });
  } catch (e) {
    logger.error({ err: e }, '[brands] addBrand error');
    res.status(500).json({ error: 'failed_to_add_brand' });
  }
};

exports.seedBrands = async (req, res) => {
  try {
    const list = Array.isArray(req.body && req.body.brands) ? req.body.brands : [
      'BMC','Orbea','Scott','Cube','Lapierre','Canyon','Peugeot','Cannondale','Specialized','Giant','Trek','Decathlon','Santa Cruz','Yeti','Pivot','Norco','Marin'
    ];
    await ensureTable();
    for (const raw of list) {
      const n = toTitleCase(String(raw || '').trim());
      if (!n) continue;
      await db.query('INSERT INTO brands (name) VALUES ($1) ON CONFLICT (lower(name)) DO NOTHING', [n]);
    }
    // Audit log
    const userId = req.user && req.user.id;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAdminAction(userId, 'seed_brands', { count: list.length, brands: list }, ipAddress);
    res.json({ ok: true, count: list.length });
  } catch (e) {
    logger.error({ err: e }, '[brands] seedBrands error');
    res.status(500).json({ error: 'failed_to_seed_brands' });
  }
};

exports.normalizeBrands = async (req, res) => {
  const client = db.pool; // use pool with explicit transaction
  try {
    await ensureTable();
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id, name FROM brands');
    const groups = new Map(); // lower(name) -> { keepId, names: [{id,name}] }
    for (const r of rows) {
      const normalizedName = String(r.name || '').toLowerCase().trim();
      if (!groups.has(normalizedName)) groups.set(normalizedName, { keepId: r.id, names: [r] });
      else groups.get(normalizedName).names.push(r);
    }
    const deleteIds = [];
    const updates = [];
    for (const [, data] of groups.entries()) {
      // choose the smallest id as canonical row to keep
      const keep = data.names.reduce((min, x) => (x.id < min.id ? x : min), data.names[0]);
      const canon = toTitleCase(keep.name);
      for (const r of data.names) {
        if (r.id !== keep.id) deleteIds.push(r.id);
      }
      updates.push({ id: keep.id, name: canon });
    }
    if (deleteIds.length) {
      // Supprimer les marques dupliquées
      await client.query('DELETE FROM brands WHERE id = ANY($1::int[])', [deleteIds]);
    }
    for (const u of updates) {
      await client.query('UPDATE brands SET name = $1 WHERE id = $2', [u.name, u.id]);
    }
    await client.query('COMMIT');
    // Audit log
    const userId = req.user && req.user.id;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAdminAction(userId, 'normalize_brands', { deleted: deleteIds.length, updated: updates.length }, ipAddress);
    res.json({ ok: true, deleted: deleteIds.length, updated: updates.length });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {
      // Ignorer les erreurs de rollback
    }
    logger.error({ err: e }, '[brands] normalizeBrands error');
    res.status(500).json({ error: 'failed_to_normalize_brands' });
  }
};
