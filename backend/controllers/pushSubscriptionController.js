// backend/controllers/pushSubscriptionController.js
const pushSubscriptionModel = require('../models/pushSubscriptionModel');
const pushNotificationService = require('../services/pushNotificationService');
const logger = require('../src/logger');

/**
 * Obtenir la clé publique VAPID (GET /api/push/vapid-public-key)
 */
function getVapidPublicKey(req, res) {
  res.json({ publicKey: pushNotificationService.getVapidPublicKey() });
}

/**
 * S'abonner aux notifications push (POST /api/push/subscribe)
 */
async function subscribe(req, res) {
  const { endpoint, keys } = req.body;
  const userId = req.user.id;

  try {
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Abonnement invalide' });
    }

    await pushSubscriptionModel.saveSubscription(
      userId,
      endpoint,
      keys.p256dh,
      keys.auth
    );

    logger.info({ userId, endpoint }, 'User subscribed to push notifications');
    
    res.json({ message: 'Abonnement enregistré avec succès' });
  } catch (err) {
    logger.error({ err, userId }, 'Error subscribing to push notifications');
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'abonnement' });
  }
}

/**
 * Se désabonner (POST /api/push/unsubscribe)
 */
async function unsubscribe(req, res) {
  const { endpoint } = req.body;

  try {
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint requis' });
    }

    await pushSubscriptionModel.removeSubscription(endpoint);
    
    logger.info({ endpoint }, 'User unsubscribed from push notifications');
    
    res.json({ message: 'Désabonnement effectué' });
  } catch (err) {
    logger.error({ err }, 'Error unsubscribing from push notifications');
    res.status(500).json({ error: 'Erreur lors du désabonnement' });
  }
}

module.exports = {
  getVapidPublicKey,
  subscribe,
  unsubscribe
};
