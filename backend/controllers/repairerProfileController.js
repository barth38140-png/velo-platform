const pool = require('../config/db');
const logger = require('../src/logger');

/**
 * Créer ou mettre à jour un profil de réparateur
 */
async function createRepaireProfile(req, res) {
    logger.debug({ body: req.body, userId }, 'Profil réparateur - payload reçu');
  const { skills, bio, service_radius_km, is_available, location_lat, location_lng, location_address } = req.body;
  const userId = req.user.id;

  try {
    // Vérifier que c'est un réparateur
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'repairer') {
      return res.status(403).json({ error: 'Seuls les réparateurs peuvent créer un profil' });
    }

    // Vérifier si le profil existe déjà
    const profileResult = await pool.query('SELECT id FROM repairer_profiles WHERE user_id = $1', [userId]);

    let profile;
    // Mettre à jour la position dans la table users uniquement si les valeurs sont valides
    if (
      typeof location_lat === 'number' && !isNaN(location_lat) &&
      typeof location_lng === 'number' && !isNaN(location_lng) &&
      location_address && location_address.length > 0
    ) {
      await pool.query(
        `UPDATE users SET location_lat = $1, location_lng = $2, location_address = $3 WHERE id = $4`,
        [location_lat, location_lng, location_address, userId]
      );
    }
    if (profileResult.rows.length > 0) {
      // Mettre à jour le profil réparateur
      const updateResult = await pool.query(
        `UPDATE repairer_profiles 
         SET skills = $1, bio = $2, service_radius_km = $3, is_available = $4, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5 RETURNING *`,
        [skills || null, bio || null, service_radius_km || 10, is_available !== false, userId]
      );
      profile = updateResult.rows[0];
    } else {
      // Créer le profil réparateur
      const insertResult = await pool.query(
        `INSERT INTO repairer_profiles (user_id, skills, bio, service_radius_km, is_available)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, skills || null, bio || null, service_radius_km || 10, is_available !== false]
      );
      profile = insertResult.rows[0];
    }

    res.json({ success: true, profile });
  } catch (err) {
    logger.error({ err, userId }, 'createRepaireProfile error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupérer le profil d'un réparateur
 */
async function getRepairerProfile(req, res) {
  const { userId } = req.params;

  try {
    const result = await pool.query(
            `SELECT u.id, u.email, u.name, u.phone, u.created_at,
              u.location_lat, u.location_lng, u.location_address,
              rp.skills, rp.bio, rp.rating, rp.service_radius_km, rp.is_available, rp.updated_at
             FROM users u
             LEFT JOIN repairer_profiles rp ON u.id = rp.user_id
             WHERE u.id = $1 AND u.role = 'repairer'`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Réparateur introuvable' });
    }

    res.json({ success: true, repairer: result.rows[0] });
  } catch (err) {
    logger.error({ err, userId }, 'getRepairerProfile error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Lister tous les réparateurs
 */
async function getAllRepairers(req, res) {
  try {
    const result = await pool.query(
            `SELECT u.id, u.email, u.name, u.phone,
              u.location_lat, u.location_lng, u.location_address,
              rp.skills, rp.bio, rp.rating, rp.service_radius_km, rp.is_available
             FROM users u
             LEFT JOIN repairer_profiles rp ON u.id = rp.user_id
             WHERE u.role = 'repairer'
             ORDER BY rp.rating DESC NULLS LAST`
    );

    res.json({ success: true, repairers: result.rows, count: result.rows.length });
  } catch (err) {
    logger.error({ err }, 'getAllRepairers error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Mettre à jour la disponibilité d'un réparateur
 */
async function updateAvailability(req, res) {
  const { is_available } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE repairer_profiles SET is_available = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 RETURNING *`,
      [is_available, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Repairer profile not found' });
    }

    res.json({ success: true, profile: result.rows[0] });
  } catch (err) {
    console.error('updateAvailability error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createRepaireProfile,
  getRepairerProfile,
  getAllRepairers,
  updateAvailability
};
