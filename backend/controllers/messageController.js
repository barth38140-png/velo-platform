const { sendMessage, getMessagesBetweenUsers, getConversations } = require('../models/messageModel');

/**
 * Envoyer un message
 */
async function send(req, res) {
  const { receiver_id, content, repair_request_id } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !content) {
    return res.status(400).json({ error: 'receiver_id and content are required' });
  }

  try {
    const message = await sendMessage(sender_id, receiver_id, content, repair_request_id || null);
    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Récupérer la conversation entre deux utilisateurs
 */
async function getConversation(req, res) {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const messages = await getMessagesBetweenUsers(currentUserId, parseInt(userId));
    res.json({ success: true, messages });
  } catch (err) {
    console.error('getConversation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Récupérer toutes les conversations de l'utilisateur
 */
async function getMyConversations(req, res) {
  const userId = req.user.id;

  try {
    const conversations = await getConversations(userId);
    res.json({ success: true, conversations });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { 
  send, 
  getConversation, 
  getMyConversations
};
