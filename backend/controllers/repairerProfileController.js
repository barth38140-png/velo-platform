const pool = require('../config/db');

/**
 * Créer ou mettre à jour un profil de réparateur
 */
async function createRepaireProfile(req, res) {
  const { skills, bio, service_radius_km, is_available } = req.body;
  const userId = req.user.id;

  try {
    // Vérifier que c'est un réparateur
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'repairer') {
      return res.status(403).json({ error: 'Only repairers can create a profile' });
    }

    // Vérifier si le profil existe déjà
    const profileResult = await pool.query('SELECT id FROM repairer_profiles WHERE user_id = $1', [userId]);

    let profile;
    if (profileResult.rows.length > 0) {
      // Mettre à jour
      const updateResult = await pool.query(
        `UPDATE repairer_profiles 
         SET skills = $1, bio = $2, service_radius_km = $3, is_available = $4, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5 RETURNING *`,
        [skills || null, bio || null, service_radius_km || 10, is_available !== false, userId]
      );
      profile = updateResult.rows[0];
    } else {
      // Créer
      const insertResult = await pool.query(
        `INSERT INTO repairer_profiles (user_id, skills, bio, service_radius_km, is_available)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, skills || null, bio || null, service_radius_km || 10, is_available !== false]
      );
      profile = insertResult.rows[0];
    }

    res.json({ success: true, profile });
  } catch (err) {
    console.error('createRepaireProfile error:', err);
    res.status(500).json({ error: 'Internal server error' });
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
              rp.skills, rp.bio, rp.rating, rp.service_radius_km, rp.is_available, rp.updated_at
       FROM users u
       LEFT JOIN repairer_profiles rp ON u.id = rp.user_id
       WHERE u.id = $1 AND u.role = 'repairer'`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Repairer not found' });
    }

    res.json({ success: true, repairer: result.rows[0] });
  } catch (err) {
    console.error('getRepairerProfile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Lister tous les réparateurs
 */
async function getAllRepairers(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.phone,
              rp.skills, rp.bio, rp.rating, rp.service_radius_km, rp.is_available
       FROM users u
       LEFT JOIN repairer_profiles rp ON u.id = rp.user_id
       WHERE u.role = 'repairer'
       ORDER BY rp.rating DESC NULLS LAST`
    );

    res.json({ success: true, repairers: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('getAllRepairers error:', err);
    res.status(500).json({ error: 'Internal server error' });
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
