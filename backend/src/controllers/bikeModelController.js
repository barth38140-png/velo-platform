const db = require('../db');
const logger = require('../logger');
const { logAdminAction } = require('../audit');

async function ensureTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS bike_models (
        id SERIAL PRIMARY KEY,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_models_lower_brand_model 
        ON bike_models ((LOWER(brand)), (LOWER(model)));
      CREATE INDEX IF NOT EXISTS idx_models_brand ON bike_models(LOWER(brand));
    `);
  } catch (e) {
    logger.error({ err: e }, '[models] failed to ensure models table');
  }
}

function toTitleCase(str) {
  return String(str || '')
    .split(/\s+/)
    .map(tok => {
      const t = tok.trim();
      if (!t) return '';
      if (t.length <= 3 && /^[A-Z0-9]+$/.test(t)) return t.toUpperCase();
      return t.toLowerCase().split('-').map(p => p ? (p[0].toUpperCase() + p.slice(1)) : p).join('-');
    })
    .join(' ');
}

exports.getModels = async (req, res) => {
  try {
    await ensureTable();
    const brand = req.query.brand;
    let query, params;
    
    if (brand && brand.trim()) {
      query = 'SELECT DISTINCT model FROM bike_models WHERE LOWER(brand) = LOWER($1) ORDER BY model ASC';
      params = [brand.trim()];
    } else {
      query = 'SELECT DISTINCT model FROM bike_models ORDER BY model ASC';
      params = [];
    }
    
    const result = await db.query(query, params);
    const models = result.rows.map(r => r.model);
    res.json({ models });
  } catch (e) {
    logger.error({ err: e }, '[models] getModels error');
    res.status(500).json({ error: 'failed_to_fetch_models' });
  }
};

exports.addModel = async (req, res) => {
  try {
    const { brand, model } = req.body || {};
    if (!brand || typeof brand !== 'string' || !brand.trim()) {
      return res.status(400).json({ error: 'invalid_brand' });
    }
    if (!model || typeof model !== 'string' || !model.trim()) {
      return res.status(400).json({ error: 'invalid_model' });
    }
    await ensureTable();
    const normalizedBrand = toTitleCase(brand.trim());
    const normalizedModel = toTitleCase(model.trim());
    
    await db.query(
      'INSERT INTO bike_models (brand, model) VALUES ($1, $2) ON CONFLICT ((LOWER(brand)), (LOWER(model))) DO NOTHING',
      [normalizedBrand, normalizedModel]
    );
    res.json({ ok: true, brand: normalizedBrand, model: normalizedModel });
  } catch (e) {
    logger.error({ err: e }, '[models] addModel error');
    res.status(500).json({ error: 'failed_to_add_model' });
  }
};

exports.seedBikeModels = async (req, res) => {
  try {
    await ensureTable();
    const defaultSeeds = [
      { brand: 'Trek', models: ['Domane SL7','Emonda SL6','Fuel EX','Madone SLR'] },
      { brand: 'Specialized', models: ['Tarmac SL7','Roubaix','Epic','Stumpjumper'] },
      { brand: 'Giant', models: ['Defy Advanced','TCR Advanced','Trance','Anthem'] },
      { brand: 'Cannondale', models: ['Synapse','SuperSix EVO','Scalpel','Topstone'] },
      { brand: 'Decathlon', models: ['Rockrider 520','Rockrider 900','Triban RC520','Van Rysel EDR'] },
      { brand: 'Orbea', models: ['Orca','Avant','Alma','Occam'] },
      { brand: 'Scott', models: ['Addict','Foil','Spark','Scale'] }
    ];
    const seeds = Array.isArray(req.body && req.body.seeds) ? req.body.seeds : defaultSeeds;
    let totalModels = 0;
    let inserted = 0;
    for (const entry of seeds) {
      if (!entry || typeof entry.brand !== 'string' || !Array.isArray(entry.models)) continue;
      const brandNorm = toTitleCase(entry.brand.trim());
      for (const rawModel of entry.models) {
        if (!rawModel || typeof rawModel !== 'string') continue;
        const modelNorm = toTitleCase(rawModel.trim());
        if (!modelNorm) continue;
        totalModels++;
        const result = await db.query(
          'INSERT INTO bike_models (brand, model) VALUES ($1, $2) ON CONFLICT ((LOWER(brand)), (LOWER(model))) DO NOTHING RETURNING id',
          [brandNorm, modelNorm]
        );
        if (result.rowCount === 1) inserted++;
      }
    }
    const userId = req.user && req.user.id;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAdminAction(userId, 'seed_bike_models', { totalBrands: seeds.length, totalModels, inserted }, ipAddress);
    res.json({ ok: true, totalBrands: seeds.length, totalModels, inserted });
  } catch (e) {
    logger.error({ err: e }, '[models] seedBikeModels error');
    res.status(500).json({ error: 'failed_to_seed_bike_models' });
  }
};
