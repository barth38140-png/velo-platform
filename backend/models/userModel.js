const pool = require('../config/db');

async function findUserByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return res.rows[0];
}

async function createUser(email, hashedPassword) {
  const res = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
    [email, hashedPassword]
  );
  return res.rows[0];
}

/**
 * Met à jour la géolocalisation d'un utilisateur
 * @param {number} userId
 * @param {number} lat
 * @param {number} lng
 */
async function updateUserLocation(userId, lat, lng) {
  await pool.query(
    'UPDATE users SET location_lat = $1, location_lng = $2 WHERE id = $3',
    [lat, lng, userId]
  );
}

/**
 * Récupère tous les utilisateurs avec leur géolocalisation
 */
async function getAllUsersWithLocation() {
  const res = await pool.query('SELECT id, email, location_lat, location_lng FROM users WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL');
  return res.rows;
}

module.exports = { findUserByEmail, createUser, updateUserLocation, getAllUsersWithLocation };
