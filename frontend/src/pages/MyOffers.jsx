import { useState, useEffect, useCallback } from 'react';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { repairOfferService } from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/MyOffers.css';
import DateNegotiationModal from '../components/DateNegotiationModal';

export function MyOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showDateModal, setShowDateModal] = useState(null);
  const toast = useToast();
  // processing state removed (unused)
  const [filter, setFilter] = useState('all'); // all, proposed, accepted, rejected

  const loadMyOffers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await repairOfferService.getRepairerOffers();
      let filtered = response.data.offers || [];
      
      if (filter !== 'all') {
        filtered = filtered.filter(offer => offer.status === filter);
      }
      setOffers(filtered);
    } catch {
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const handleProposeDate = async (offerId, scheduledFrom, scheduledTo) => {
    try {
      await repairOfferService.proposeDate(offerId, scheduledFrom, scheduledTo);
      toast.success('📅 Date proposée au client');
      setShowDateModal(null);
      await loadMyOffers();
    } catch (err) {
      throw err;
    }
  };

  const handleConfirmDate = async (offerId) => {
    try {
      await repairOfferService.confirmDate(offerId);
      toast.success('✅ Date confirmée !');
      setShowDateModal(null);
      await loadMyOffers();
    } catch (err) {
      throw err;
    }
  };

  // Charger immédiatement à l'ouverture de la vue et à chaque changement de filtre
  useEffect(() => {
    if (user?.role === 'repairer') {
      loadMyOffers();
    }
  }, [user?.role, loadMyOffers]);

  useEffect(() => {
    // Reload offers when server notifies of offer changes
    const handleOfferUpdate = () => { 
      setInfo('Mise à jour en temps réel des offres');
      loadMyOffers(); 
      setTimeout(() => setInfo(''), 2000);
    };
    try {
      socket.on('offer_update', handleOfferUpdate);
    } catch {
      /* socket not available */
    }
    return () => {
      try { socket.off('offer_update', handleOfferUpdate); } catch { /* ignore */ }
    };
  }, [loadMyOffers]);

  

  return (
    <div className="my-offers">
      <h2>My Repair Offers</h2>
      
      {error && <div className="error-toast">{error}</div>}
      {info && <div className="info-toast">{info}</div>}
      
      <div className="filter-tabs">
        {['all', 'proposed', 'accepted', 'rejected'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner"><div className="loader"></div> Chargement des offres...</div>
      ) : offers.length > 0 ? (
        <div className="offers-list">
          {offers.map(offer => (
            <div key={offer.id} className={`offer-card ${offer.status}`}>
              <div className="offer-header">
                <h3>{offer.repair_title}</h3>
                <span className={`status-badge ${offer.status}`}>
                  {offer.status.toUpperCase()}
                </span>
              </div>
              
              <div className="offer-body">
                <p className="client-name">
                  <strong>Client:</strong> {offer.client_name}
                </p>
                {offer.client_phone ? (
                  <p className="client-contact"><strong>Contact:</strong> {offer.client_phone}</p>
                ) : (
                  <p className="client-contact"><strong>Contact:</strong> Via platform</p>
                )}
                {offer.location_address && (
                  <p className="client-location"><strong>Location:</strong> {offer.location_address}</p>
                )}
                <p className="repair-description">{offer.repair_description}</p>
                
                <div className="offer-terms">
                  <span className="price">
                    <strong>Quote:</strong> {(() => {
                      const p = Number(offer.price);
                      return Number.isFinite(p) ? `€${p.toFixed(2)}` : '—';
                    })()}
                  </span>
                  <span className="duration">
                    <strong>Duration:</strong> {(() => {
                      const d = Number(offer.duration);
                      return Number.isFinite(d) ? `${d}h` : '—';
                    })()}
                  </span>
                </div>
                
                {offer.message && (
                  <div className="offer-message">
                    <strong>My Message:</strong>
                    <p>{offer.message}</p>
                  </div>
                )}

                {offer.scheduled_from && (
                  <div className="offer-date">
                    <strong>Date d'intervention:</strong> {new Date(offer.scheduled_from).toLocaleString('fr-FR')}
                    {offer.date_status === 'confirmed' && <span className="badge-success">✅ Confirmée</span>}
                    {offer.date_status === 'proposed_by_repairer' && <span className="badge-warning">⏳ Votre proposition</span>}
                    {offer.date_status === 'proposed_by_client' && <span className="badge-info">⏳ Proposée par client</span>}
                  </div>
                )}
              </div>

              {offer.status === 'proposed' && (
                <div className="offer-actions">
                  {offer.date_status !== 'confirmed' && (
                    <button 
                      className="btn-date-negotiate" 
                      onClick={() => setShowDateModal(offer.id)}
                      style={{marginBottom: '0.5rem'}}
                    >
                      📅 {offer.scheduled_from ? 'Négocier la date' : 'Proposer une date'}
                    </button>
                  )}
                  <p className="info-text">En attente de décision du client...</p>
                </div>
              )}
              {offer.status === 'accepted' && (
                <div className="offer-accepted-info">
                  ✓ Client accepted this offer
                </div>
              )}
              {offer.status === 'rejected' && (
                <div className="offer-rejected-info">
                  ✗ Client rejected this offer
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No offers found</p>
      )}

      {/* Modal de négociation de dates */}
      {showDateModal && (
        <DateNegotiationModal
          offer={offers.find(o => o.id === showDateModal)}
          onClose={() => setShowDateModal(null)}
          onDateProposed={(from, to) => handleProposeDate(showDateModal, from, to)}
          onDateConfirmed={() => handleConfirmDate(showDateModal)}
          isClient={false}
        />
      )}
    </div>
  );
}
