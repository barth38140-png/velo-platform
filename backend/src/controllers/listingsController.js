const db = require('../db');

async function createListing(req, res) {
  try {
    const { repairer_id, title, description, price, duration_min, visible = true } = req.body;
    if (!repairer_id || !title) return res.status(400).json({ error: 'repairer_id and title required' });

    const q = `INSERT INTO listings (repairer_id, title, description, price, duration_min, visible)
               VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const { rows } = await db.query(q, [repairer_id, title, description, price, duration_min, visible]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

async function getListings(req, res) {
  try {
    const { repairer_id, visible } = req.query;
    const conditions = [];
    const params = [];
    if (repairer_id) { params.push(repairer_id); conditions.push(`repairer_id = $${params.length}`); }
    if (typeof visible !== 'undefined') { params.push(visible === 'true'); conditions.push(`visible = $${params.length}`); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const q = `SELECT * FROM listings ${where} ORDER BY id DESC LIMIT 100`;
    const { rows } = await db.query(q, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

module.exports = { createListing, getListings };


