import React from 'react';
import '../styles/OfferBadge.css';

/**
 * Badge affichant le nombre d'offres reçues pour une demande
 * avec indicateur visuel et code couleur
 */
export default function OfferBadge({ count, hasNew = false, status = 'en_attente' }) {
  if (count === 0) return null;

  const getColor = () => {
    if (hasNew) return 'new';
    if (status === 'assignée' || status === 'en_cours') return 'assigned';
    if (count >= 5) return 'many';
    if (count >= 3) return 'several';
    return 'few';
  };

  return (
    <div className={`offer-badge ${getColor()}`} title={`${count} offre${count > 1 ? 's' : ''} reçue${count > 1 ? 's' : ''}`}>
      {hasNew && <span className="new-indicator">●</span>}
      <span className="offer-icon">💼</span>
      <span className="offer-count">{count}</span>
    </div>
  );
}
