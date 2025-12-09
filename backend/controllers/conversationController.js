const conversationModel = require('../models/conversationModel');
const messageModel = require('../models/messageModel');
const logger = require('../src/logger');

/**
 * Crée une conversation entre client et réparateur pour une demande
 */
async function createConversation(req, res) {
  // Log de debug du body reçu
  console.log('[DEBUG] createConversation body:', req.body);
  // On attend maintenant que le frontend envoie le vrai clientId lié à la demande
  const { repairerId, repairRequestId, clientId } = req.body;
  if (!clientId) {
    return res.status(400).json({ error: 'Client requis' });
  }
  if (!repairerId) {
    return res.status(400).json({ error: 'Réparateur requis' });
  }
  try {
    // Vérifier si une conversation existe déjà
    let conv = await conversationModel.findConversation(clientId, repairerId, repairRequestId);
    if (!conv) {
      conv = await conversationModel.createConversation(clientId, repairerId, repairRequestId);
    }
    res.status(201).json({ success: true, conversation: conv });
  } catch (err) {
    logger.error({ err, clientId, repairerId }, 'createConversation error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupère toutes les conversations de l'utilisateur
 */
async function getMyConversations(req, res) {
  const userId = req.user.id;
  try {
    const convs = await conversationModel.getConversationsByUser(userId);
    res.json({ success: true, conversations: convs });
  } catch (err) {
    logger.error({ err, userId }, 'getMyConversations error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupère les messages d'une conversation
 */
async function getMessages(req, res) {
  const { conversationId } = req.params;
  try {
    const messages = await messageModel.getMessagesByConversation(conversationId);
    res.json({ success: true, messages });
  } catch (err) {
    logger.error({ err, conversationId }, 'getMessages error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Envoie un message dans une conversation
 */
async function sendMessage(req, res) {
  const { conversationId } = req.params;
  const { content } = req.body;
  const senderId = req.user.id;
  if (!content) {
    return res.status(400).json({ error: 'Contenu requis' });
  }
  try {
    const msg = await messageModel.sendMessage(conversationId, senderId, content);
    // TODO: socket.io emit
    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    logger.error({ err, senderId, conversationId }, 'sendMessage error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  createConversation,
  getMyConversations,
  getMessages,
  sendMessage
};
