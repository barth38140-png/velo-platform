
import React from 'react';
import statutLibelle from '../utils/statutLibelle';
import truncate from '../utils/truncate';
import '../styles/ExploreRepairs.css';

/**
 * Carte d'affichage d'une demande à explorer pour le réparateur (optimisée)
 * @param {object} props - { repair, isNew, loadingOfferId, loadingMsgId, onOffer, onContact }
 */
export default function RepairCard({ repair, isNew, loadingOfferId, loadingMsgId, onOffer, onContact }) {
  return (
    <li className="repair-item" tabIndex={0} aria-label={`Demande ${repair.title}, statut ${statutLibelle[repair.status] || repair.status}, type ${repair.bike_type}, adresse ${repair.location_address}`}> 
      <div className="repair-card-header">
        <b>{repair.title}</b>
        {isNew && <span className="badge badge-nouveau" aria-label="Nouveau">Nouveau</span>}
        <span className={`badge badge-status badge-${repair.status}`}>{statutLibelle[repair.status] || repair.status}</span>
      </div>
      <div className="repair-card-meta">
        <span><i className="icon-bike" aria-label="Type de vélo" /> {repair.bike_type}</span>
        <span><i className="icon-location" aria-label="Adresse" /> {truncate(repair.location_address, 40)}</span>
        <span className="repair-date"><i className="icon-date" aria-label="Date" /> {new Date(repair.created_at).toLocaleDateString()}</span>
      </div>
      <div className="repair-desc">{truncate(repair.description, 80)}</div>
      <div className="repair-actions">
        <button className="offer-btn" aria-label={`Proposer une offre pour ${repair.title}`} disabled={loadingOfferId===repair.id} onClick={onOffer}>
          {loadingOfferId===repair.id ? 'Chargement...' : 'Proposer une offre'}
        </button>
        <button className="offer-btn" style={{background:'#e6f7ff',color:'#005a9e'}} aria-label={`Contacter le client pour ${repair.title}`} disabled={loadingMsgId===repair.id} onClick={onContact}>
          {loadingMsgId===repair.id ? 'Chargement...' : 'Contacter le client'}
        </button>
      </div>
    </li>
  );
}
