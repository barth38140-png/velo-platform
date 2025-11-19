const pool = require('../config/db');

async function sendMessage(senderId, receiverId, content, repairRequestId = null) {
  const res = await pool.query(
    'INSERT INTO messages (sender_id, receiver_id, repair_request_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
    [senderId, receiverId, repairRequestId, content]
  );
  return res.rows[0];
}

async function getMessagesBetweenUsers(userA, userB) {
  const res = await pool.query(
    `SELECT * FROM messages
     WHERE (sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY sent_at ASC`,
    [userA, userB]
  );
  return res.rows;
}

async function getConversations(userId) {
  const res = await pool.query(
    `SELECT DISTINCT 
       CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id,
       (SELECT name FROM users WHERE id = CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END) as other_user_name,
       (SELECT email FROM users WHERE id = CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END) as other_user_email,
       MAX(sent_at) as last_message_at,
       (SELECT content FROM messages m2 WHERE (m2.sender_id = $1 AND m2.receiver_id = CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END OR m2.sender_id = CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AND m2.receiver_id = $1) ORDER BY m2.sent_at DESC LIMIT 1) as last_message
     FROM messages
     WHERE sender_id = $1 OR receiver_id = $1
     GROUP BY other_user_id, other_user_name, other_user_email
     ORDER BY last_message_at DESC`,
    [userId]
  );
  return res.rows;
}

async function markAsRead(messageId) {
  const res = await pool.query(
    'UPDATE messages SET is_read = TRUE WHERE id = $1 RETURNING *',
    [messageId]
  );
  return res.rows[0];
}

module.exports = { 
  sendMessage, 
  getMessagesBetweenUsers, 
  getConversations,
  markAsRead
};
