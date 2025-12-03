const pool = require('../config/db');

async function ensureBikeExtraColumns() {
  try {
    await pool.query('ALTER TABLE bikes ADD COLUMN IF NOT EXISTS wheel_size TEXT');
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE bikes ADD COLUMN IF NOT EXISTS brand TEXT');
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE bikes ADD COLUMN IF NOT EXISTS model TEXT');
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE bikes ADD COLUMN IF NOT EXISTS model_ref_id INTEGER');
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE bikes ADD COLUMN IF NOT EXISTS year INTEGER');
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE bikes ADD COLUMN IF NOT EXISTS serial_number TEXT');
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE bikes ADD COLUMN IF NOT EXISTS colors JSONB');
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE bikes ADD COLUMN IF NOT EXISTS tech JSONB');
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE bikes ADD COLUMN IF NOT EXISTS unknown_attributes JSONB');
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE bikes ADD COLUMN IF NOT EXISTS confidence_score REAL');
  } catch (e) {}
  try {
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_bikes_user_serial_lower'
        ) THEN
          CREATE UNIQUE INDEX uniq_bikes_user_serial_lower ON bikes (user_id, LOWER(serial_number)) WHERE serial_number IS NOT NULL;
        END IF;
      END $$;`);
  } catch (e) {}
}

async function createBike(userId, name, type, frame_size, notes, wheel_size, brand, model, year, serial_number, colors, model_ref_id = null) {
  await ensureBikeExtraColumns();
  let res;
  try {
    res = await pool.query(
      'INSERT INTO bikes (user_id, name, brand, model, model_ref_id, type, frame_size, notes, wheel_size, year, serial_number, colors, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CURRENT_TIMESTAMP) RETURNING *',
      [userId, name, brand || null, model || null, model_ref_id || null, type || null, frame_size || null, notes || null, wheel_size || null, year || null, serial_number || null, colors || null]
    );
  } catch (e) {
    // Fallback to minimal set if some columns are missing in legacy DBs
    res = await pool.query(
      'INSERT INTO bikes (user_id, name, type, frame_size, notes, created_at) VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP) RETURNING *',
      [userId, name, type || null, frame_size || null, notes || null]
    );
  }
  return res.rows[0];
}

async function getBikesByUser(userId) {
  const res = await pool.query(
    `SELECT b.*,
      COALESCE(json_agg(json_build_object('id', c.id, 'name', c.name, 'type', c.type, 'wear', c.wear, 'last_replaced_at', c.last_replaced_at)) FILTER (WHERE c.id IS NOT NULL), '[]') as components
     FROM bikes b
     LEFT JOIN bike_components c ON c.bike_id = b.id
     WHERE b.user_id = $1
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return res.rows;
}

async function getBikeById(bikeId) {
  const res = await pool.query('SELECT * FROM bikes WHERE id = $1', [bikeId]);
  const bike = res.rows[0];
  if (!bike) return null;
  const compRes = await pool.query(
    'SELECT id, name, type, wear, last_replaced_at FROM bike_components WHERE bike_id = $1 ORDER BY id',
    [bikeId]
  );
  bike.components = compRes.rows;
  return bike;
}

async function updateComponentWear(componentId, wear, replaced = false) {
  const now = replaced ? 'CURRENT_TIMESTAMP' : 'last_replaced_at';
  const res = await pool.query(
    `UPDATE bike_components SET wear = $1 ${replaced ? ', last_replaced_at = CURRENT_TIMESTAMP' : ''} WHERE id = $2 RETURNING *`,
    [wear, componentId]
  );
  return res.rows[0];
}

module.exports = { createBike, getBikesByUser, getBikeById, updateComponentWear };
// Create and delete component helpers
async function createComponent(bikeId, name, type, installedAt) {
  const res = await pool.query(
    'INSERT INTO bike_components (bike_id, name, type, last_replaced_at, wear) VALUES ($1,$2,$3,$4,0) RETURNING *',
    [bikeId, name, type, installedAt || null]
  );
  return res.rows[0];
}

async function deleteComponent(componentId) {
  const res = await pool.query('DELETE FROM bike_components WHERE id = $1 RETURNING *', [componentId]);
  return res.rows[0];
}

async function deleteBike(bikeId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // delete components (if any) - if DB has ON DELETE CASCADE this is redundant but safe
    await client.query('DELETE FROM bike_components WHERE bike_id = $1', [bikeId]);
    const res = await client.query('DELETE FROM bikes WHERE id = $1 RETURNING *', [bikeId]);
    await client.query('COMMIT');
    return res.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function updateBike(bikeId, fields) {
  await ensureBikeExtraColumns();
  const allowed = ['name', 'type', 'frame_size', 'notes', 'wheel_size', 'brand', 'model', 'model_ref_id', 'year', 'serial_number', 'colors', 'tech', 'unknown_attributes', 'confidence_score'];
  const entries = Object.entries(fields).filter(([k, v]) => allowed.includes(k));
  if (entries.length === 0) throw new Error('no_fields');
  const setFragments = [];
  const params = [];
  entries.forEach(([k, v], idx) => {
    setFragments.push(`${k} = $${idx + 1}`);
    params.push(v);
  });
  params.push(bikeId);
  const sql = `UPDATE bikes SET ${setFragments.join(', ')} WHERE id = $${params.length} RETURNING *`;
  const res = await pool.query(sql, params);
  return res.rows[0];
}

async function updateBikeTech(bikeId, tech, unknownAttributes, confidence) {
  await ensureBikeExtraColumns();
  const fields = {};
  if (tech && typeof tech === 'object') fields.tech = tech;
  if (Array.isArray(unknownAttributes)) fields.unknown_attributes = unknownAttributes;
  if (typeof confidence === 'number') fields.confidence_score = confidence;
  if (Object.keys(fields).length === 0) throw new Error('no_fields');
  return updateBike(bikeId, fields);
}

module.exports = { createBike, getBikesByUser, getBikeById, updateComponentWear, createComponent, deleteComponent, deleteBike, updateBike, updateBikeTech };
