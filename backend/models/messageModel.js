const pool = require('../config/db');

// Nouveau modèle conversation/message pour la messagerie structurée
async function sendMessage(conversationId, senderId, content) {
  const res = await pool.query(
    'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
    [conversationId, senderId, content]
  );
  return res.rows[0];
}

async function getMessagesByConversation(conversationId) {
  const res = await pool.query(
    'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY sent_at ASC',
    [conversationId]
  );
  return res.rows;
}

module.exports = {
  sendMessage,
  getMessagesByConversation
};
