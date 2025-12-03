import React from 'react';
import '../styles/StatusBadge.css';

/**
 * Badge visuel pour afficher le statut d'une demande ou d'une offre
 * Avec code couleur et icône appropriés
 */
export default function StatusBadge({ status, type = 'repair' }) {
  const getStatusInfo = () => {
    if (type === 'repair') {
      switch (status) {
        case 'créée':
          return { label: 'Créée', icon: '📝', className: 'created' };
        case 'en_attente':
          return { label: 'En attente', icon: '⏳', className: 'pending' };
        case 'assignée':
          return { label: 'Assignée', icon: '👤', className: 'assigned' };
        case 'en_cours':
          return { label: 'En cours', icon: '🔧', className: 'in-progress' };
        case 'terminée':
          return { label: 'Terminée', icon: '✅', className: 'completed' };
        case 'annulée':
          return { label: 'Annulée', icon: '❌', className: 'cancelled' };
        default:
          return { label: status, icon: '•', className: 'unknown' };
      }
    } else if (type === 'offer') {
      switch (status) {
        case 'proposée':
          return { label: 'Proposée', icon: '💼', className: 'proposed' };
        case 'acceptée':
          return { label: 'Acceptée', icon: '✅', className: 'accepted' };
        case 'rejetée':
          return { label: 'Rejetée', icon: '❌', className: 'rejected' };
        case 'annulée':
          return { label: 'Annulée', icon: '🚫', className: 'cancelled' };
        default:
          return { label: status, icon: '•', className: 'unknown' };
      }
    }
    return { label: status, icon: '•', className: 'unknown' };
  };

  const info = getStatusInfo();

  return (
    <span className={`status-badge ${info.className}`} title={info.label}>
      <span className="status-icon">{info.icon}</span>
      <span className="status-label">{info.label}</span>
    </span>
  );
}
