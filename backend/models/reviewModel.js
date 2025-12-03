// backend/models/reviewModel.js
const { pool } = require('../config/db');

/**
 * Créer un avis pour une réparation terminée
 * @param {number} repairRequestId 
 * @param {number} clientId 
 * @param {number} repairerId 
 * @param {number} rating (1-5)
 * @param {string} comment 
 * @returns {Promise<object>}
 */
async function createReview(repairRequestId, clientId, repairerId, rating, comment) {
  const result = await pool.query(
    `INSERT INTO repair_reviews (repair_request_id, client_id, repairer_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [repairRequestId, clientId, repairerId, rating, comment]
  );
  return result.rows[0];
}

/**
 * Récupérer l'avis d'une réparation spécifique
 * @param {number} repairRequestId 
 * @returns {Promise<object|null>}
 */
async function getReviewByRepairId(repairRequestId) {
  const result = await pool.query(
    `SELECT rr.*, 
            u.name as client_name,
            u2.name as repairer_name
     FROM repair_reviews rr
     JOIN users u ON rr.client_id = u.id
     JOIN users u2 ON rr.repairer_id = u2.id
     WHERE rr.repair_request_id = $1`,
    [repairRequestId]
  );
  return result.rows[0] || null;
}

/**
 * Récupérer tous les avis d'un réparateur avec pagination
 * @param {number} repairerId 
 * @param {number} limit 
 * @param {number} offset 
 * @returns {Promise<object>}
 */
async function getReviewsByRepairerId(repairerId, limit = 10, offset = 0) {
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM repair_reviews WHERE repairer_id = $1',
    [repairerId]
  );
  
  const result = await pool.query(
    `SELECT rr.*, 
            u.name as client_name,
            rq.title as repair_title
     FROM repair_reviews rr
     JOIN users u ON rr.client_id = u.id
     JOIN repair_requests rq ON rr.repair_request_id = rq.id
     WHERE rr.repairer_id = $1
     ORDER BY rr.created_at DESC
     LIMIT $2 OFFSET $3`,
    [repairerId, limit, offset]
  );
  
  return {
    reviews: result.rows,
    total: parseInt(countResult.rows[0].count),
    limit,
    offset
  };
}

/**
 * Calculer la note moyenne d'un réparateur
 * @param {number} repairerId 
 * @returns {Promise<object>}
 */
async function getRepairerRatingStats(repairerId) {
  const result = await pool.query(
    `SELECT 
      COALESCE(AVG(rating), 0) as average_rating,
      COUNT(*) as review_count,
      COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
      COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
      COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
      COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
      COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
     FROM repair_reviews
     WHERE repairer_id = $1`,
    [repairerId]
  );
  
  const stats = result.rows[0];
  return {
    averageRating: parseFloat(stats.average_rating).toFixed(1),
    reviewCount: parseInt(stats.review_count),
    distribution: {
      5: parseInt(stats.five_stars),
      4: parseInt(stats.four_stars),
      3: parseInt(stats.three_stars),
      2: parseInt(stats.two_stars),
      1: parseInt(stats.one_star)
    }
  };
}

/**
 * Vérifier si un client peut noter une réparation
 * @param {number} repairRequestId 
 * @param {number} clientId 
 * @returns {Promise<boolean>}
 */
async function canClientReview(repairRequestId, clientId) {
  // Vérifier que la réparation est terminée et appartient au client
  const result = await pool.query(
    `SELECT id FROM repair_requests 
     WHERE id = $1 AND client_id = $2 AND status = 'terminée'
     AND NOT EXISTS (
       SELECT 1 FROM repair_reviews WHERE repair_request_id = $1
     )`,
    [repairRequestId, clientId]
  );
  return result.rows.length > 0;
}

module.exports = {
  createReview,
  getReviewByRepairId,
  getReviewsByRepairerId,
  getRepairerRatingStats,
  canClientReview
};
