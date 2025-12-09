// frontend/src/services/pushNotification.js

/**
 * Service pour gérer les notifications push Web Push API
 */

let vapidPublicKey = null;

/**
 * Vérifier si les notifications sont supportées
 */
export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Enregistrer le Service Worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported');
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    // logger.info('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    // logger.error('Service Worker registration failed:', error);
    throw error;
  }
}

/**
 * Obtenir la clé publique VAPID du serveur
 */
async function getVapidPublicKey() {
  if (vapidPublicKey) return vapidPublicKey;

  try {
    const response = await fetch('/api/push/vapid-public-key');
    const data = await response.json();
    vapidPublicKey = data.publicKey;
    return vapidPublicKey;
  } catch (error) {
    // logger.error('Failed to get VAPID public key:', error);
    throw error;
  }
}

/**
 * Convertir la clé VAPID en Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Demander la permission pour les notifications
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * S'abonner aux notifications push
 */
export async function subscribeToPushNotifications() {
  try {
    // Vérifier le support
    if (!isPushNotificationSupported()) {
      throw new Error('Push notifications not supported');
    }

    // Demander la permission
    const permission = await requestNotificationPermission();
    if (!permission) {
      throw new Error('Notification permission denied');
    }

    // Enregistrer le Service Worker
    const registration = await registerServiceWorker();

    // Attendre que le SW soit actif
    await navigator.serviceWorker.ready;

    // Obtenir la clé VAPID
    const publicKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // S'abonner aux notifications push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // Envoyer l'abonnement au serveur
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }

    // logger.info('Successfully subscribed to push notifications');
    return subscription;
  } catch (error) {
    // logger.error('Error subscribing to push notifications:', error);
    throw error;
  }
}

/**
 * Se désabonner des notifications push
 */
export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Informer le serveur
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      // logger.info('Successfully unsubscribed from push notifications');
    }
  } catch (error) {
    // logger.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
}

/**
 * Obtenir le statut actuel de l'abonnement
 */
export async function getPushNotificationStatus() {
  try {
    if (!isPushNotificationSupported()) {
      return { supported: false, subscribed: false, permission: 'default' };
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    const permission = Notification.permission;

    return {
      supported: true,
      subscribed: !!subscription,
      permission
    };
  } catch (error) {
    // logger.error('Error getting push notification status:', error);
    return { supported: false, subscribed: false, permission: 'default' };
  }
}
