import React, { useState, useEffect } from 'react';
import {
  isPushNotificationSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushNotificationStatus
} from '../services/pushNotification';
import '../styles/PushNotificationSettings.css';

/**
 * Composant pour activer/désactiver les notifications push
 */
export default function PushNotificationSettings() {
  const [status, setStatus] = useState({
    supported: false,
    subscribed: false,
    permission: 'default'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const currentStatus = await getPushNotificationStatus();
    setStatus(currentStatus);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await subscribeToPushNotifications();
      setMessage('✅ Notifications activées avec succès !');
      await loadStatus();
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await unsubscribeFromPushNotifications();
      setMessage('Notifications désactivées');
      await loadStatus();
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!status.supported) {
    return (
      <div className="push-settings">
        <h3>🔔 Notifications</h3>
        <p className="not-supported">
          Les notifications push ne sont pas supportées par votre navigateur.
        </p>
      </div>
    );
  }

  return (
    <div className="push-settings">
      <h3>🔔 Notifications push</h3>
      
      <p className="description">
        Recevez des notifications en temps réel pour les offres, messages et mises à jour de vos réparations.
      </p>

      <div className="status-indicator">
        <span className={`indicator ${status.subscribed ? 'active' : 'inactive'}`} />
        <span className="status-text">
          {status.subscribed ? 'Activées' : 'Désactivées'}
        </span>
      </div>

      {message && (
        <div className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {status.permission === 'denied' && (
        <div className="warning">
          ⚠️ Vous avez bloqué les notifications. Veuillez modifier les paramètres de votre navigateur pour les autoriser.
        </div>
      )}

      <div className="actions">
        {!status.subscribed ? (
          <button
            className="btn-primary"
            onClick={handleSubscribe}
            disabled={loading || status.permission === 'denied'}
          >
            {loading ? 'Activation...' : '🔔 Activer les notifications'}
          </button>
        ) : (
          <button
            className="btn-secondary"
            onClick={handleUnsubscribe}
            disabled={loading}
          >
            {loading ? 'Désactivation...' : '🔕 Désactiver les notifications'}
          </button>
        )}
      </div>

      <div className="info">
        <small>
          💡 Les notifications vous alertent instantanément des événements importants, même lorsque la page n'est pas ouverte.
        </small>
      </div>
    </div>
  );
}
