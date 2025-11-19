const pool = require('../config/db');

async function upsertLocation(userId, latitude, longitude, address = null) {
  const sql = `
    INSERT INTO locations (user_id, latitude, longitude, address)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      address = EXCLUDED.address,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const res = await pool.query(sql, [userId, latitude, longitude, address]);
  return res.rows[0];
}

async function getLocationByUser(userId) {
  const sql = `
    SELECT *
    FROM locations
    WHERE user_id = $1
    LIMIT 1;
  `;
  const res = await pool.query(sql, [userId]);
  return res.rows[0];
}

/**
 * Trouver les réparateurs proches d'une localisation
 * @param latitude
 * @param longitude
 * @param radiusKm Rayon de recherche en km
 */
async function findNearbyRepairers(latitude, longitude, radiusKm = 10) {
  // Utiliser la formule de Haversine pour calculer la distance
  const sql = `
    SELECT 
      u.id, u.email, u.name, u.phone,
      rp.skills, rp.bio, rp.rating, rp.service_radius_km, rp.is_available,
      loc.latitude, loc.longitude, loc.address,
      (6371 * acos(cos(radians($1)) * cos(radians(loc.latitude)) * cos(radians($2) - radians(loc.longitude)) + sin(radians($1)) * sin(radians(loc.latitude)))) AS distance_km
    FROM users u
    JOIN repairer_profiles rp ON u.id = rp.user_id
    JOIN locations loc ON u.id = loc.user_id
    WHERE u.role = 'repairer' AND rp.is_available = TRUE
      AND (6371 * acos(cos(radians($1)) * cos(radians(loc.latitude)) * cos(radians($2) - radians(loc.longitude)) + sin(radians($1)) * sin(radians(loc.latitude)))) <= $3
    ORDER BY distance_km ASC;
  `;
  const res = await pool.query(sql, [latitude, longitude, radiusKm]);
  return res.rows;
}

module.exports = {
  upsertLocation,
  getLocationByUser,
  findNearbyRepairers
};