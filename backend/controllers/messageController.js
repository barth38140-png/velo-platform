const { sendMessage, getMessagesBetweenUsers, getConversations } = require('../models/messageModel');
const logger = require('../src/logger');

/**
 * Envoyer un message
 */
async function send(req, res) {
  const { receiver_id, content, repair_request_id } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !content) {
    return res.status(400).json({ error: 'Destinataire et contenu requis' });
  }

  try {
    const message = await sendMessage(sender_id, receiver_id, content, repair_request_id || null);
    res.status(201).json({ success: true, message });
  } catch (err) {
    logger.error({ err, sender_id, receiver_id }, 'sendMessage error');
    res.status(500).json({ error: 'Erreur serveur' });
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
    logger.error({ err, currentUserId, userId }, 'getConversation error');
    res.status(500).json({ error: 'Erreur serveur' });
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
    logger.error({ err, userId }, 'getConversations error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { 
  send, 
  getConversation, 
  getMyConversations
};
