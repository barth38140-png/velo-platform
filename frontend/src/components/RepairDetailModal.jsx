import React from 'react';
import OffresList from '../pages/OffresList';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RepairDetailModal({ repair, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleContact() {
    try {
      const acceptedOffer = (repair.offers || []).find(o => o.status === 'accepted');
      if (!acceptedOffer) {
        alert('Aucune offre acceptée pour cette demande. Contactez un réparateur via une offre.');
        return;
      }
      const payload = { repairerId: acceptedOffer.repairer_id, repairRequestId: repair.id };
      await axios.post('/api/conversations', payload, { headers: { Authorization: `Bearer ${user?.token}` } });
      // Redirection ou feedback ici si besoin
    } catch (error) {
      alert('Erreur lors de la prise de contact avec le réparateur.');
    }
  }

  // Rendu principal du composant
  return (
    <div>
      <header className="modal-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
        <h3 style={{fontSize:'1.25rem',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:22}}>🛠️</span> {repair.title}
        </h3>
      </header>
      <div className="modal-body" style={{marginTop:10}}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>📍</span>
            <span><b>Adresse :</b> {repair.location_address || 'Non renseignée'}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>🚲</span>
            <span><b>Type :</b> {repair.type || 'Général'}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>📝</span>
            <span><b>Description :</b> {repair.description || 'Non renseignée'}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>📅</span>
            <span><b>Statut :</b> {repair.status || 'Non renseigné'}</span>
          </div>
          {repair.hasAcceptedOffer ? (
            <div style={{ marginTop: 16 }}>
              <button className="btn primary" onClick={handleContact} style={{fontWeight:600,fontSize:'1rem'}}>Contacter le réparateur</button>
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <div style={{background:'#fffbe6',border:'1px solid #ffe082',borderRadius:8,padding:'12px 14px',color:'#8a6d1b',fontSize:'0.98em',display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:22}}>💡</span>
                <span>
                  Vous n'avez pas encore reçu d'offre.<br/>
                  <strong>Pour trouver un réparateur :</strong>
                  <ul style={{margin:'6px 0 0 18px',padding:0}}>
                    <li>Attendez qu’un réparateur vous propose une offre (vous serez notifié).</li>
                    <li>Ou contactez directement des réparateurs depuis l’onglet <b>Réparateurs</b> du menu.</li>
                  </ul>
                  <span style={{fontSize:'0.97em',color:'#b48b00'}}>Dès qu’une offre est acceptée, vous pourrez échanger avec le réparateur ici.</span>
                </span>
              </div>
            </div>
          )}
        </div>
        {/* Afficher la section Offres associées uniquement si la demande a des offres */}
        {repair.offers && repair.offers.length > 0 && (
          <section className="modal-offers" style={{background:'#f4f6fa',borderRadius:10,padding:'14px 14px 8px 14px',boxShadow:'0 1px 4px #0001'}}>
            <h4 style={{fontSize:'1.1rem',fontWeight:600,margin:'0 0 10px 0',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:18}}>💼</span> Offres associées
            </h4>
            <OffresList selectedRepair={repair} />
          </section>
        )}
      </div>
    </div>
  );
}
