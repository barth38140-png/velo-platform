import React from 'react';
import OffresList from '../pages/OffresList';
import '../styles/Modal.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RepairDetailModal({ repair, onClose }) {
  // IMPORTANT: Call hooks unconditionally at top level
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleContact() {
    try {
      // Simple choix: contacter le réparateur de l'offre acceptée s'il existe, sinon message d'info
      const acceptedOffer = (repair.offers || []).find(o => o.status === 'accepted');
      if (!acceptedOffer) {
        alert("Aucune offre acceptée pour cette demande. Contactez un réparateur via une offre.");
        return;
      }
      const payload = { repairerId: acceptedOffer.repairer_id, repairRequestId: repair.id };
      await axios.post('/api/conversations', payload, { headers: { Authorization: `Bearer ${user?.token}` } });
      onClose && onClose();
      navigate('/dashboard?tab=messages');
    } catch (e) {
      alert("Impossible de créer la conversation");
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose && onClose(); }}>
      <div className="modal-content">
        {!repair ? (
          <div style={{ padding: '20px', color: '#9ca3af' }}>Chargement...</div>
        ) : (
          <>
            <header className="modal-header">
              <h3>{repair.title}</h3>
              <button className="btn" onClick={() => onClose && onClose()}>Fermer</button>
            </header>
            <div className="modal-body">
              <div className="repair-details">
                <p><strong>Adresse:</strong> {repair.location_address || '—'}</p>
                <p><strong>Type:</strong> {repair.bike_type || '—'}</p>
                <p><strong>Description:</strong> {repair.description || '—'}</p>
                <p><strong>Statut:</strong> <span className={`status ${repair.status}`}>{repair.status}</span></p>
                <div style={{ marginTop: 12 }}>
                  <button className="btn" onClick={handleContact}>Contacter le réparateur</button>
                </div>
              </div>

              <section className="modal-offers">
                <h4>Offres associées</h4>
                <OffresList selectedRepair={repair} />
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
