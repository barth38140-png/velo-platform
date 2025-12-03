// backend/models/pushSubscriptionModel.js
const { pool } = require('../config/db');

/**
 * Sauvegarder ou mettre à jour un abonnement push
 * @param {number} userId 
 * @param {string} endpoint 
 * @param {string} p256dh 
 * @param {string} auth 
 * @returns {Promise<object>}
 */
async function saveSubscription(userId, endpoint, p256dh, auth) {
  const result = await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, last_used)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, endpoint) 
     DO UPDATE SET last_used = CURRENT_TIMESTAMP, p256dh = $3, auth = $4
     RETURNING *`,
    [userId, endpoint, p256dh, auth]
  );
  return result.rows[0];
}

/**
 * Récupérer tous les abonnements d'un utilisateur
 * @param {number} userId 
 * @returns {Promise<array>}
 */
async function getUserSubscriptions(userId) {
  const result = await pool.query(
    'SELECT * FROM push_subscriptions WHERE user_id = $1',
    [userId]
  );
  return result.rows;
}

/**
 * Supprimer un abonnement invalide
 * @param {string} endpoint 
 */
async function removeSubscription(endpoint) {
  await pool.query(
    'DELETE FROM push_subscriptions WHERE endpoint = $1',
    [endpoint]
  );
}

module.exports = {
  saveSubscription,
  getUserSubscriptions,
  removeSubscription
};
