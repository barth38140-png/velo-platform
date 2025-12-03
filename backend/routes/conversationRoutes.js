const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth');
const conversationController = require('../controllers/conversationController');

// Créer une conversation (client initie)
router.post('/', authenticateToken, conversationController.createConversation);
// Récupérer toutes les conversations de l'utilisateur
router.get('/', authenticateToken, conversationController.getMyConversations);
// Récupérer les messages d'une conversation
router.get('/:conversationId/messages', authenticateToken, conversationController.getMessages);
// Envoyer un message dans une conversation
router.post('/:conversationId/messages', authenticateToken, conversationController.sendMessage);

module.exports = router;
