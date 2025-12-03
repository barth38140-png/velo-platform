// public/service-worker.js
/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'velo-platform-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stratégie de cache : Network First, fallback sur cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cloner la réponse car elle ne peut être utilisée qu'une fois
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Réception des notifications push
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || [],
    tag: data.tag || 'default',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur une notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  let urlToOpen = '/dashboard';

  // Router vers la bonne page selon le type de notification
  if (notificationData) {
    switch (notificationData.type) {
      case 'new_offer':
      case 'offer_accepted':
      case 'offer_rejected':
        urlToOpen = '/dashboard/demandes-offres';
        break;
      case 'new_message':
        urlToOpen = '/dashboard/messagerie';
        break;
      case 'repair_started':
      case 'repair_completed':
        urlToOpen = '/dashboard/demandes-offres';
        break;
      default:
        urlToOpen = '/dashboard';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenêtre est déjà ouverte, la focus
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
