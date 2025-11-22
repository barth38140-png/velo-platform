const pool = require('../config/db');

async function createRepairRequest(userId, title, description, bikeType = null, locationLat = null, locationLng = null, locationAddress = null, metadata = {}) {
  const res = await pool.query(
    'INSERT INTO repair_requests (user_id, title, description, bike_type, location_lat, location_lng, location_address, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [userId, title, description, bikeType, locationLat, locationLng, locationAddress, metadata]
  );
  return res.rows[0];
}

async function getRepairRequestsByUser(userId) {
  const res = await pool.query(
    `SELECT r.*, COALESCE(json_agg(json_build_object('id', p.id, 'filename', p.filename, 'filepath', p.filepath, 'uploaded_at', p.uploaded_at)) FILTER (WHERE p.id IS NOT NULL), '[]') as photos
     FROM repair_requests r
     LEFT JOIN repair_request_photos p ON p.repair_request_id = r.id
     WHERE r.user_id = $1
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

async function updateRepairRequestStatus(requestId, status, assignedRepairerId = null) {
  const res = await pool.query(
    'UPDATE repair_requests SET status = $1, assigned_repairer_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
    [status, assignedRepairerId, requestId]
  );
  return res.rows[0];
}

async function getAllRepairRequests() {
  const res = await pool.query(
    `SELECT r.*, COALESCE(json_agg(json_build_object('id', p.id, 'filename', p.filename, 'filepath', p.filepath, 'uploaded_at', p.uploaded_at)) FILTER (WHERE p.id IS NOT NULL), '[]') as photos
     FROM repair_requests r
     LEFT JOIN repair_request_photos p ON p.repair_request_id = r.id
     WHERE r.status = $1
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
    ['pending']
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
