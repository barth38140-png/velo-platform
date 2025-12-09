const pool = require('../config/db');

/**
 * Crée une demande de réparation avec statut initial 'créée'
 */
async function createRepairRequest(userId, title, description, bikeType = null, locationLat = null, locationLng = null, locationAddress = null, metadata = {}) {
  // Some DB instances (older dumps) may not include the `metadata` column.
  // Try inserting including metadata first; if column is missing, fall back to insert without metadata.
  // Check whether the `metadata` column exists, avoid relying on catching an insert error
  const colCheck = await pool.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_requests' AND column_name = 'metadata' LIMIT 1");
  const hasMetadataCol = colCheck && colCheck.rowCount > 0;
  if (hasMetadataCol) {
    const res = await pool.query(
      'INSERT INTO repair_requests (user_id, title, description, bike_type, location_lat, location_lng, location_address, metadata, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [userId, title, description, bikeType, locationLat, locationLng, locationAddress, metadata, 'créée']
    );
    return res.rows[0];
  }
  // fallback: insert without metadata column
  const res2 = await pool.query(
    'INSERT INTO repair_requests (user_id, title, description, bike_type, location_lat, location_lng, location_address, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [userId, title, description, bikeType, locationLat, locationLng, locationAddress, 'créée']
  );
  return res2 && res2.rows && res2.rows.length > 0 ? res2.rows[0] : null;
}

async function getRepairRequestsByUser(userId) {
  const res = await pool.query(
    `SELECT r.*, 
            COALESCE(json_agg(json_build_object('id', p.id, 'filename', p.filename, 'filepath', p.filepath, 'uploaded_at', p.uploaded_at)) FILTER (WHERE p.id IS NOT NULL), '[]') as photos,
            EXISTS(SELECT 1 FROM repair_offers ro WHERE ro.repair_request_id = r.id AND ro.status = 'acceptée') as has_accepted_offer
     FROM repair_requests r
     LEFT JOIN repair_request_photos p ON p.repair_request_id = r.id
     WHERE r.user_id = $1 AND COALESCE(r.status, 'en_attente') <> 'annulée'
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return res.rows;
}

async function getRepairRequestById(requestId) {
  const res = await pool.query(
    'SELECT * FROM repair_requests WHERE id = $1',
    [requestId]
  );
  const repair = res.rows[0];
  if (!repair) return null;

  // Fetch photos
  const photosRes = await pool.query(
    'SELECT id, filename, filepath, uploaded_at FROM repair_request_photos WHERE repair_request_id = $1 ORDER BY uploaded_at ASC',
    [requestId]
  );
  repair.photos = photosRes.rows;
  return repair;
}

/**
 * Met à jour le statut d'une demande de réparation
 * Statuts possibles : créée, en_attente, acceptée, refusée, terminée
 */
async function updateRepairRequestStatus(requestId, status, assignedRepairerId = null) {
  const res = await pool.query(
    'UPDATE repair_requests SET status = $1, assigned_repairer_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
    [status, assignedRepairerId, requestId]
  );
  return res.rows[0];
}

/**
 * Récupère toutes les demandes de réparation par statut
 */
async function getAllRepairRequests(status = 'créée') {
  const res = await pool.query(
    `SELECT r.*, COALESCE(json_agg(json_build_object('id', p.id, 'filename', p.filename, 'filepath', p.filepath, 'uploaded_at', p.uploaded_at)) FILTER (WHERE p.id IS NOT NULL), '[]') as photos
     FROM repair_requests r
     LEFT JOIN repair_request_photos p ON p.repair_request_id = r.id
     WHERE r.status = $1
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
    [status]
  );
  return res.rows;
}

module.exports = {
  createRepairRequest,
  getRepairRequestsByUser,
  getRepairRequestById,
  updateRepairRequestStatus,
  getAllRepairRequests
};
