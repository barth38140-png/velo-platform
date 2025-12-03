const { createBike, getBikesByUser, getBikeById, updateComponentWear, createComponent, deleteComponent, updateBike, updateBikeTech } = require('../models/bikeModel');
const pool = require('../config/db');
const logger = require('../src/logger');

async function createBikeHandler(req, res) {
  const userId = req.user && req.user.id;
  const { name, type, frame_size, notes, wheel_size, brand, model, year, serial_number, colors, model_ref_id } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const bike = await createBike(
      userId,
      name,
      type || null,
      frame_size || null,
      notes || null,
      wheel_size || null,
      brand || null,
      model || null,
      typeof year === 'number' ? year : (year ? parseInt(year, 10) || null : null),
      serial_number || null,
      Array.isArray(colors) ? colors : null,
      model_ref_id || null
    );
    res.status(201).json({ success: true, bike });
  } catch (err) {
    const code = err && err.code;
    const msg = (err && err.message) || '';
    if (code === '23505' && /serial/i.test(msg)) {
      return res.status(409).json({ error: 'Numéro de série déjà utilisé', field: 'serial_number' });
    }
    logger.error({ err, userId, name }, 'createBike error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function getMyBikes(req, res) {
  const userId = req.user && req.user.id;
  try {
    const bikes = await getBikesByUser(userId);
    res.json({ success: true, bikes });
  } catch (err) {
    logger.error({ err, userId }, 'getMyBikes error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function getBikeDetail(req, res) {
  const { bikeId } = req.params;
  try {
    const bike = await getBikeById(bikeId);
    if (!bike) return res.status(404).json({ error: 'Vélo introuvable' });
    res.json({ success: true, bike });
  } catch (err) {
    logger.error({ err, bikeId }, 'getBikeDetail error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function patchComponentWear(req, res) {
  const { componentId } = req.params;
  const { wear, replaced } = req.body;
  if (wear == null) return res.status(400).json({ error: 'wear required' });
  try {
    const updated = await updateComponentWear(componentId, wear, !!replaced);
    res.json({ success: true, component: updated });
  } catch (err) {
    logger.error({ err, componentId, wear, replaced }, 'patchComponentWear error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function createComponentHandler(req, res) {
  const userId = req.user && req.user.id;
  const { bikeId } = req.params;
  const { name, type, installed_at } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    // ensure bike belongs to user
    const bike = await getBikeById(bikeId);
    if (!bike) return res.status(404).json({ error: 'Vélo introuvable' });
    if (bike.user_id !== userId) return res.status(403).json({ error: 'Accès interdit' });
    const comp = await createComponent(bikeId, name, type || null, installed_at || null);
    res.status(201).json({ success: true, component: comp });
  } catch (err) {
    logger.error({ err, bikeId, name, userId }, 'createComponent error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function deleteComponentHandler(req, res) {
  const userId = req.user && req.user.id;
  const { componentId } = req.params;
  try {
    // confirm component exists and belongs to a bike owned by user
    const compRes = await pool.query('SELECT bike_id FROM bike_components WHERE id = $1', [componentId]);
    if (!compRes.rows[0]) return res.status(404).json({ error: 'Composant introuvable' });
    const bike = await getBikeById(compRes.rows[0].bike_id);
    if (!bike) return res.status(404).json({ error: 'Vélo introuvable' });
    if (bike.user_id !== userId) return res.status(403).json({ error: 'Accès interdit' });
    const deleted = await deleteComponent(componentId);
    res.json({ success: true, component: deleted });
  } catch (err) {
    logger.error({ err, componentId, userId }, 'deleteComponent error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { createBikeHandler, getMyBikes, getBikeDetail, patchComponentWear, createComponentHandler, deleteComponentHandler };
// delete bike handler
async function deleteBikeHandler(req, res) {
  const userId = req.user && req.user.id;
  const { bikeId } = req.params;
  try {
    const bike = await getBikeById(bikeId);
    if (!bike) return res.status(404).json({ error: 'Vélo introuvable' });
    if (bike.user_id !== userId) return res.status(403).json({ error: 'Accès interdit' });
    // perform deletion using model's deleteBike (transactional)
    const { deleteBike } = require('../models/bikeModel');
    const deleted = await deleteBike(bikeId);
    res.json({ success: true, bike: deleted });
  } catch (err) {
    logger.error({ err, bikeId, userId }, 'deleteBike error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// export including delete handler
async function updateBikeHandler(req, res) {
  const userId = req.user && req.user.id;
  const { bikeId } = req.params;
  try {
    const existing = await getBikeById(bikeId);
    if (!existing) return res.status(404).json({ error: 'Vélo introuvable' });
    if (existing.user_id !== userId) return res.status(403).json({ error: 'Accès interdit' });

    const { name, type, frame_size, notes, wheel_size, brand, model, model_ref_id, year, serial_number, colors } = req.body || {};
    const updates = {};
    if (typeof name === 'string') updates.name = name.trim();
    if (typeof type === 'string') updates.type = type.trim();
    if (typeof frame_size === 'string') updates.frame_size = frame_size.trim();
    if (typeof notes === 'string') updates.notes = notes.trim();
    if (typeof wheel_size === 'string') updates.wheel_size = wheel_size.trim();
    if (typeof brand === 'string') updates.brand = brand.trim();
    if (typeof model === 'string') updates.model = model.trim();
    if (model_ref_id != null) updates.model_ref_id = model_ref_id;
    if (year != null) updates.year = (typeof year === 'number' ? year : (parseInt(year, 10) || null));
    if (typeof serial_number === 'string') updates.serial_number = serial_number.trim();
    if (Array.isArray(colors)) updates.colors = colors;

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

    const updated = await updateBike(bikeId, updates);
    res.json({ success: true, bike: updated });
  } catch (err) {
    const code = err && err.code;
    const msg = (err && err.message) || '';
    if (code === '23505' && /serial/i.test(msg)) {
      return res.status(409).json({ error: 'Numéro de série déjà utilisé', field: 'serial_number' });
    }
    logger.error({ err, bikeId, userId }, 'updateBike error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function updateBikeTechHandler(req, res) {
  const userId = req.user && req.user.id;
  const { bikeId } = req.params;
  const { tech, unknown_attributes } = req.body || {};
  try {
    const existing = await getBikeById(bikeId);
    if (!existing) return res.status(404).json({ error: 'Vélo introuvable' });
    if (existing.user_id !== userId) return res.status(403).json({ error: 'Accès interdit' });
    // Simple confidence: ratio of known core attrs
    const core = ['brand','model','frame_size','colors','type'];
    let known = 0; let total = core.length;
    core.forEach(k => {
      const val = k === 'colors' ? existing.colors : existing[k];
      if (Array.isArray(val)) {
        if (val.length && !val.includes('__UNKNOWN__')) known++; else { /* unknown */ }
      } else if (val && val !== '__UNKNOWN__') known++;
    });
    // Unknown overrides: if provided in body, merge for recalculation
    if (unknown_attributes && Array.isArray(unknown_attributes)) {
      // ensure uniqueness
      const uniq = Array.from(new Set(unknown_attributes.map(String)));
      // adjust known count removing ones explicitly unknown
      uniq.forEach(attr => { if (core.includes(attr)) { /* mark unknown */ } });
    }
    const confidence = Number((known / total).toFixed(2));
    const updated = await updateBikeTech(bikeId, tech || null, unknown_attributes || null, confidence);
    res.json({ success: true, bike: updated });
  } catch (err) {
    logger.error({ err, bikeId, userId }, 'updateBikeTech error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { createBikeHandler, getMyBikes, getBikeDetail, patchComponentWear, createComponentHandler, deleteComponentHandler, deleteBikeHandler, updateBikeHandler, updateBikeTechHandler };
