const pool = require('../config/db');

async function createRepairRequest(userId, title, description, bikeType = null, locationLat = null, locationLng = null, locationAddress = null) {
  const res = await pool.query(
    'INSERT INTO repair_requests (user_id, title, description, bike_type, location_lat, location_lng, location_address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [userId, title, description, bikeType, locationLat, locationLng, locationAddress]
  );
  return res.rows[0];
}

async function getRepairRequestsByUser(userId) {
  const res = await pool.query(
    'SELECT * FROM repair_requests WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return res.rows;
}

async function getRepairRequestById(requestId) {
  const res = await pool.query(
    'SELECT * FROM repair_requests WHERE id = $1',
    [requestId]
  );
  return res.rows[0];
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
    'SELECT * FROM repair_requests WHERE status = $1 ORDER BY created_at DESC',
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
