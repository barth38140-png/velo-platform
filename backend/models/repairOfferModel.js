const pool = require('../config/db');

// Create a repair offer
async function createRepairOffer(repairRequestId, repairerId, offeredPrice, estimatedDurationHours, message) {
  const sql = `
    INSERT INTO repair_offers (repair_request_id, repairer_id, offered_price, estimated_duration_hours, message)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  try {
    const res = await pool.query(sql, [repairRequestId, repairerId, offeredPrice, estimatedDurationHours, message]);
    return res.rows[0];
  } catch (err) {
    // If DB unique constraint exists, let the controller handle duplicate attempts
    // Rethrow the error so caller can inspect err.code (e.g. '23505' for unique_violation)
    throw err;
  }
}

// Get all offers for a repair request
async function getOffersByRepairRequest(repairRequestId) {
  const sql = `
    SELECT 
      ro.id,
      ro.repair_request_id,
      ro.repairer_id,
      rr.user_id as client_id,
      ro.offered_price,
      ro.estimated_duration_hours,
      ro.message,
      ro.status,
      ro.created_at,
      u.name as repairer_name,
      u.email as repairer_email,
      u.phone as repairer_phone,
      rp.rating,
      rp.skills
    FROM repair_offers ro
    JOIN users u ON ro.repairer_id = u.id
    LEFT JOIN repairer_profiles rp ON u.id = rp.user_id
    WHERE ro.repair_request_id = $1
    ORDER BY ro.created_at DESC;
  `;
  const res = await pool.query(sql, [repairRequestId]);
  return res.rows;
}

// Get offers sent by a repairer
async function getOffersByRepairer(repairerId) {
  const sql = `
    SELECT 
      ro.id,
      ro.repair_request_id,
      ro.repairer_id,
      ro.offered_price as price,
      ro.estimated_duration_hours as duration,
      ro.message,
      ro.status,
      ro.created_at,
      rr.title as repair_title,
      rr.location_address,
      rr.description as repair_description,
      rr.bike_type,
      u.name as client_name,
      u.email as client_email
    FROM repair_offers ro
    JOIN repair_requests rr ON ro.repair_request_id = rr.id
    JOIN users u ON rr.user_id = u.id
    WHERE ro.repairer_id = $1
    ORDER BY ro.created_at DESC;
  `;
  const res = await pool.query(sql, [repairerId]);
  return res.rows;
}

// Get a single offer
async function getOfferById(offerId) {
  const sql = `
    SELECT 
      ro.id,
      ro.repair_request_id,
      ro.repairer_id,
      ro.offered_price,
      ro.estimated_duration_hours,
      ro.message,
      ro.status,
      ro.created_at,
      ro.updated_at,
      u.name as repairer_name,
      u.email as repairer_email,
      rp.rating,
      rp.skills
    FROM repair_offers ro
    JOIN users u ON ro.repairer_id = u.id
    LEFT JOIN repairer_profiles rp ON u.id = rp.user_id
    WHERE ro.id = $1;
  `;
  const res = await pool.query(sql, [offerId]);
  return res.rows[0];
}

// Update offer status (accept/reject)
async function updateOfferStatus(offerId, status) {
  const sql = `
    UPDATE repair_offers
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `;
  const res = await pool.query(sql, [status, offerId]);
  return res.rows[0];
}

// Get offers received by a client
async function getOffersByClient(clientId) {
  const sql = `
    SELECT 
      ro.id,
      ro.repair_request_id,
      ro.repairer_id,
      ro.offered_price as price,
      ro.estimated_duration_hours as duration,
      ro.message,
      ro.status,
      ro.created_at,
      rr.title as repair_title,
      rr.location_address,
      rr.description as repair_description,
      rr.bike_type,
      u.name as repairer_name,
      u.email as repairer_email,
      u.phone as repairer_phone
    FROM repair_offers ro
    JOIN repair_requests rr ON ro.repair_request_id = rr.id
    JOIN users u ON ro.repairer_id = u.id
    WHERE rr.user_id = $1
    ORDER BY ro.created_at DESC;
  `;
  const res = await pool.query(sql, [clientId]);
  return res.rows;
}

// Check if repairer already offered on this repair
async function hasExistingOffer(repairRequestId, repairerId) {
  const sql = `
    SELECT id FROM repair_offers
    WHERE repair_request_id = $1 AND repairer_id = $2;
  `;
  const res = await pool.query(sql, [repairRequestId, repairerId]);
  return res.rows.length > 0;
}

module.exports = {
  createRepairOffer,
  getOffersByRepairRequest,
  getOffersByRepairer,
  getOffersByClient,
  getOfferById,
  updateOfferStatus,
  hasExistingOffer
};
