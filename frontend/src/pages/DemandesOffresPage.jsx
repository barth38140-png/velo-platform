import React, { useState } from 'react';
import DemandesList from './DemandesList';
import OffresList from './OffresList';
import '../styles/DemandesOffres.css';
import RepairForm from '../components/RepairForm';
import RepairDetailModal from '../components/RepairDetailModal';
import '../styles/Modal.css';

export default function DemandesOffresPage() {
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="demandes-offres-page">
      <div className="demandes-offres-header">
        <h2>Demandes et Offres</h2>
      </div>
      <div className="demandes-offres-layout">
        <aside className="demandes-column" aria-label="Mes demandes">
          <h3>Mes demandes</h3>
          <DemandesList onSelect={setSelectedRepair} selected={selectedRepair} />
          {/* Add-create card at end of demands list */}
          <div className="demand-add-card" style={{marginTop:12}}>
            <button className="btn new-request-btn" onClick={() => setShowCreateModal(true)} aria-label="Nouvelle demande">
              <span className="icon">➕</span>
              <span className="label">Nouvelle demande</span>
            </button>
          </div>
        </aside>

        <section className="offres-column" aria-label="Offres reçues">
          <h3>Offres reçues</h3>
          <OffresList selectedRepair={selectedRepair} />
        </section>
      </div>
      {showCreateModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setShowCreateModal(false); }}>
          <div className="modal-content">
            <header className="modal-header">
              <h3>Nouvelle demande</h3>
              <button className="btn" onClick={() => setShowCreateModal(false)}>Fermer</button>
            </header>
            <div className="modal-body">
              <div className="repair-details" style={{flex:'1 1 100%'}}>
                <RepairForm onSuccess={() => setShowCreateModal(false)} onCancel={() => setShowCreateModal(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
