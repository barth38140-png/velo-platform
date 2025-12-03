// backend/routes/pushSubscriptionRoutes.js
const express = require('express');
const router = express.Router();
const pushSubscriptionController = require('../controllers/pushSubscriptionController');
const { authenticate } = require('../middlewares/auth');

// Obtenir la clé publique VAPID (public, pas besoin d'auth)
router.get('/vapid-public-key', pushSubscriptionController.getVapidPublicKey);

// S'abonner aux notifications push
router.post('/subscribe', authenticate, pushSubscriptionController.subscribe);

// Se désabonner
router.post('/unsubscribe', authenticate, pushSubscriptionController.unsubscribe);

module.exports = router;
