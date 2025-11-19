const express = require('express');
const router = express.Router();
const { send, getConversation, getMyConversations } = require('../controllers/messageController');
const authenticateToken = require('../middlewares/auth');
const { validateSendMessage } = require('../middlewares/validators');

router.post('/', authenticateToken, validateSendMessage, send);
router.get('/conversations', authenticateToken, getMyConversations);
router.get('/:userId', authenticateToken, getConversation);

module.exports = router;

