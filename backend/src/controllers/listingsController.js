const db = require('../db');
const logger = require('../logger');

async function createListing(req, res) {
  const { repairer_id, title } = req.body || {};
  try {
    const { description, price, duration_min, visible = true } = req.body || {};
    if (!repairer_id || !title) return res.status(400).json({ error: 'missing_repairer_or_title', message: 'ID réparateur et titre requis' });

    const q = `INSERT INTO listings (repairer_id, title, description, price, duration_min, visible)
               VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const { rows } = await db.query(q, [repairer_id, title, description, price, duration_min, visible]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    logger.error({ err, repairer_id, title }, 'createListing error');
    return res.status(500).json({ error: 'internal_error', message: 'Erreur serveur' });
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
    logger.error({ err }, 'getListings error');
    return res.status(500).json({ error: 'internal_error', message: 'Erreur serveur' });
  }
}

module.exports = { createListing, getListings };


