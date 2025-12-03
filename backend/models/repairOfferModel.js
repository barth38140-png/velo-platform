const pool = require('../config/db');
const logger = require('../src/logger');

// Crée une offre de réparation avec statut initial 'proposée'
// Ajout: scheduled_from / scheduled_to pour proposer une date d'intervention
async function createRepairOffer(repairRequestId, repairerId, offeredPrice, estimatedDurationHours, message, scheduledFrom = null, scheduledTo = null) {
  // Détecter dynamiquement la présence des colonnes pour compatibilité avec anciens dumps
  let hasScheduled = false;
  try {
    const colCheck = await pool.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'repair_offers' AND column_name IN ('scheduled_from','scheduled_to')"
    );
    const cnt = Number(colCheck?.rows?.[0]?.cnt || 0);
    hasScheduled = cnt === 2;
  } catch (e) {
    hasScheduled = false;
  }

  const sqlWithDates = `
    INSERT INTO repair_offers (repair_request_id, repairer_id, offered_price, estimated_duration_hours, message, scheduled_from, scheduled_to)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const sqlWithoutDates = `
    INSERT INTO repair_offers (repair_request_id, repairer_id, offered_price, estimated_duration_hours, message)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  try {
    const res = hasScheduled
      ? await pool.query(sqlWithDates, [repairRequestId, repairerId, offeredPrice, estimatedDurationHours, message, scheduledFrom, scheduledTo])
      : await pool.query(sqlWithoutDates, [repairRequestId, repairerId, offeredPrice, estimatedDurationHours, message]);
    return res.rows[0];
  } catch (err) {
    logger.error({ err, repairRequestId, repairerId }, 'createRepairOffer query error');
    throw err;
  }
}
// Met à jour le statut d'une offre de réparation
// Statuts possibles : proposée, acceptée, refusée, annulée
async function updateRepairOfferStatus(offerId, status) {
  const sql = `UPDATE repair_offers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;`;
  const res = await pool.query(sql, [status, offerId]);
  return res.rows[0];
}

// Get all offers for a repair request
async function getOffersByRepairRequest(repairRequestId) {
  // Détecter la présence des colonnes optionnelles
  let hasScheduled = false;
  try {
    const colCheck = await pool.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_offers' AND column_name = 'scheduled_from' LIMIT 1");
    hasScheduled = colCheck && colCheck.rowCount > 0;
  } catch (e) {
    hasScheduled = false;
  }
  const scheduledSelect = hasScheduled ? 'ro.scheduled_from, ro.scheduled_to,' : '';
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
      ${scheduledSelect}
      ro.created_at,
      u.name as repairer_name,
      u.email as repairer_email,
      u.phone as repairer_phone,
      rp.rating,
      rp.skills
    FROM repair_offers ro
    LEFT JOIN repair_requests rr ON ro.repair_request_id = rr.id
    LEFT JOIN users u ON ro.repairer_id = u.id
    LEFT JOIN repairer_profiles rp ON u.id = rp.user_id
    WHERE ro.repair_request_id = $1
    ORDER BY ro.created_at DESC;
  `;
  try {
    const res = await pool.query(sql, [repairRequestId]);
    return res.rows;
  } catch (err) {
    logger.error({ err, repairRequestId }, 'getOffersByRepairRequest query error');
    throw err;
  }
}

// Get offers sent by a repairer
async function getOffersByRepairer(repairerId) {
  // Certaines bases n'ont pas les colonnes scheduled_from/scheduled_to
  let hasScheduledCols = false;
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_name = 'repair_offers' AND table_schema = 'public' AND column_name IN ('scheduled_from','scheduled_to')"
    );
    hasScheduledCols = Number(rows?.[0]?.cnt) === 2;
  } catch (e) {
    hasScheduledCols = false;
  }

  const scheduledSelect = hasScheduledCols ? 'ro.scheduled_from, ro.scheduled_to,' : '';
  const sql = `
    SELECT 
      ro.id,
      ro.repair_request_id,
      ro.repairer_id,
      ro.offered_price as price,
      ro.estimated_duration_hours as duration,
      ro.message,
      ro.status,
      ${scheduledSelect}
      ro.created_at,
      rr.title as repair_title,
      rr.description as repair_description,
      rr.location_address,
      rr.user_id as client_id,
      u2.name as client_name,
      u2.phone as client_phone
    FROM repair_offers ro
    JOIN repair_requests rr ON ro.repair_request_id = rr.id
    JOIN users u2 ON rr.user_id = u2.id
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
      ro.scheduled_from,
      ro.scheduled_to,
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
      ro.scheduled_from,
      ro.scheduled_to,
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

// Proposer ou contre-proposer des dates d'intervention
async function proposeDates(offerId, scheduledFrom, scheduledTo, proposedBy, dateStatus) {
  const sql = `
    UPDATE repair_offers 
    SET scheduled_from = $1,
        scheduled_to = $2,
        proposed_by = $3,
        date_status = $4,
        date_confirmed_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *;
  `;
  const res = await pool.query(sql, [scheduledFrom, scheduledTo, proposedBy, dateStatus, offerId]);
  return res.rows[0];
}

// Confirmer une date proposée
async function confirmDate(offerId) {
  const sql = `
    UPDATE repair_offers 
    SET date_status = 'confirmed',
        date_confirmed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `;
  const res = await pool.query(sql, [offerId]);
  return res.rows[0];
}

module.exports = {
  createRepairOffer,
  getOffersByRepairRequest,
  getOffersByRepairer,
  getOffersByClient,
  getOfferById,
  updateOfferStatus,
  updateRepairOfferStatus,
  hasExistingOffer,
  proposeDates,
  confirmDate
};
