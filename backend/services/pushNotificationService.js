// backend/services/pushNotificationService.js
const webPush = require('web-push');
const pushSubscriptionModel = require('../models/pushSubscriptionModel');
const logger = require('../src/logger');

// VAPID keys - générer avec: npx web-push generate-vapid-keys
// À configurer dans .env en production
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEL-Wp6rKMxrCmQpFkZI3nTxQmNb8xJnqZvLq3PH6bkw_DqK4nXFxJd5JzG7xYH_mYvN2MzRqW8pKxLhZvPqYjQ';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'RHg3LqF8vMxQpKzNb4_6xYjWzRvLh2TqN8pF7bHzVmY';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@velo-platform.com';

webPush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

/**
 * Envoyer une notification push à un utilisateur
 * @param {number} userId 
 * @param {object} payload - { title, body, icon, data }
 */
async function sendNotificationToUser(userId, payload) {
  try {
    const subscriptions = await pushSubscriptionModel.getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      logger.debug({ userId }, 'No push subscriptions found for user');
      return;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title || 'Velo Platform',
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {},
      timestamp: Date.now()
    });

    const promises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webPush.sendNotification(pushSubscription, notificationPayload);
        logger.info({ userId, endpoint: sub.endpoint }, 'Push notification sent');
      } catch (error) {
        logger.error({ userId, endpoint: sub.endpoint, error: error.message }, 'Failed to send push notification');
        
        // Si l'abonnement est expiré ou invalide (410 Gone), le supprimer
        if (error.statusCode === 410) {
          await pushSubscriptionModel.removeSubscription(sub.endpoint);
          logger.info({ endpoint: sub.endpoint }, 'Removed expired subscription');
        }
      }
    });

    await Promise.allSettled(promises);
  } catch (err) {
    logger.error({ err, userId }, 'Error sending push notification');
  }
}

/**
 * Notifications pour événements spécifiques
 */
const notificationTemplates = {
  offerAccepted: (repairTitle) => ({
    title: '✅ Offre acceptée !',
    body: `Votre offre pour "${repairTitle}" a été acceptée`,
    data: { type: 'offer_accepted' }
  }),
  offerRejected: (repairTitle) => ({
    title: '❌ Offre refusée',
    body: `Votre offre pour "${repairTitle}" a été refusée`,
    data: { type: 'offer_rejected' }
  }),
  newOffer: (repairTitle, repairerName) => ({
    title: '💼 Nouvelle offre',
    body: `${repairerName} a soumis une offre pour "${repairTitle}"`,
    data: { type: 'new_offer' }
  }),
  repairStarted: (repairTitle) => ({
    title: '🔧 Réparation démarrée',
    body: `La réparation "${repairTitle}" a commencé`,
    data: { type: 'repair_started' }
  }),
  repairCompleted: (repairTitle) => ({
    title: '✅ Réparation terminée',
    body: `La réparation "${repairTitle}" est terminée. N'oubliez pas de laisser un avis !`,
    data: { type: 'repair_completed' }
  }),
  newMessage: (senderName, preview) => ({
    title: `💬 Message de ${senderName}`,
    body: preview,
    data: { type: 'new_message' }
  })
};

module.exports = {
  sendNotificationToUser,
  notificationTemplates,
  getVapidPublicKey: () => VAPID_PUBLIC_KEY
};
