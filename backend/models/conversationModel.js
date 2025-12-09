/**
 * Vérifie s'il existe déjà une conversation entre client et réparateur (optionnellement pour une demande)
 */
async function findConversation(clientId, repairerId, repairRequestId) {
  let query = 'SELECT * FROM conversations WHERE client_id = $1 AND repairer_id = $2';
  let params = [clientId, repairerId];
  if (repairRequestId) {
    query += ' AND repair_request_id = $3';
    params.push(repairRequestId);
  } else {
    query += ' AND repair_request_id IS NULL';
  }
  const res = await pool.query(query, params);
  return res.rows[0];
}

const pool = require('../config/db');

/**
 * Crée une conversation entre client et réparateur pour une demande donnée
 */
async function createConversation(clientId, repairerId, repairRequestId) {
  const res = await pool.query(
    'INSERT INTO conversations (client_id, repairer_id, repair_request_id) VALUES ($1, $2, $3) RETURNING *',
    [clientId, repairerId, repairRequestId]
  );
  return res.rows[0];
}

/**
 * Récupère toutes les conversations d'un utilisateur
 */
async function getConversationsByUser(userId) {
  const res = await pool.query(
    'SELECT * FROM conversations WHERE client_id = $1 OR repairer_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return res.rows;
}

/**
 * Récupère une conversation par id
 */
async function getConversationById(conversationId) {
  const res = await pool.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
  return res.rows[0];
}

module.exports = {
  createConversation,
  getConversationsByUser,
  getConversationById,
  findConversation
};
