import { useState, useEffect, useCallback } from 'react';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { repairOfferService } from '../services/api';
import '../styles/OffersReceived.css';

export function OffersReceived() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingOfferId, setProcessingOfferId] = useState(null);
  const [filter, setFilter] = useState('all');
  // selectedOffer removed (not used)

  const loadReceivedOffers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await repairOfferService.getClientOffers();
      let filtered = response.data.offers || [];

      if (filter !== 'all') {
        filtered = filtered.filter(offer => offer.status === filter);
      }
      setOffers(filtered);
    } catch (err) {
      console.error('Erreur lors du chargement des offres :', err);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user?.role === 'client') {
      loadReceivedOffers();
    }
  }, [user, loadReceivedOffers]);

  useEffect(() => {
    // Reload offers when server notifies of changes (accept/reject)
    const onStatusUpdate = () => { loadReceivedOffers(); };
    const onOfferUpdate = () => { loadReceivedOffers(); };
    try {
      socket.on('status_update', onStatusUpdate);
      socket.on('offer_update', onOfferUpdate);
    } catch {
      /* socket not available */
    }
    return () => {
      try { socket.off('status_update', onStatusUpdate); socket.off('offer_update', onOfferUpdate); } catch { /* ignore */ }
    };
  }, [loadReceivedOffers]);

  

  const handleAcceptOffer = async (offerId) => {
    try {
      await repairOfferService.acceptOffer(offerId);
      await loadReceivedOffers();
    } catch (err) {
      console.error('Erreur lors de l\'acceptation de l\'offre :', err);
      setError(err.response?.data?.error || 'Failed to accept offer');
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await repairOfferService.rejectOffer(offerId);
      await loadReceivedOffers();
    } catch {
      setError('Failed to reject offer');
    }
  };

  const getRepairer = (offer) => {
    return offer.repairer_name || 'Unknown Repairer';
  };

  return (
    <div className="offers-received">
      <h2>Offers Received</h2>
      
      {error && <div className="error-toast">{error}</div>}
      
      <div className="filter-tabs">
        {['all', 'pending', 'accepted', 'rejected'].map(status => (
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
        <div className="offers-grid">
          {offers.map(offer => (
            <div key={offer.id} className={`offer-card ${offer.status}`} data-cy={`offer-card-${offer.id}`}>
              <div className="offer-header">
                <h3 data-cy={`offer-repairer-${offer.id}`}>{getRepairer(offer)}</h3>
                <span className={`status-badge ${offer.status}`} data-cy={`offer-status-${offer.id}`}>
                  {offer.status.toUpperCase()}
                </span>
              </div>
              
              <div className="offer-body">
                <p className="repair-title">
                  <strong>Repair:</strong> {offer.repair_title}
                </p>
                
                <div className="offer-quote">
                  <div className="quote-item">
                    <span className="label">Quoted Price</span>
                    <span className="value">
                      {(() => {
                        const rawPrice = (offer.price ?? offer.offered_price ?? offer.offered_price);
                        const num = Number(rawPrice);
                        return Number.isFinite(num) ? `€${num.toFixed(2)}` : '—';
                      })()}
                    </span>
                  </div>
                  <div className="quote-item">
                    <span className="label">Estimated Duration</span>
                    <span className="value">
                      {(() => {
                        const rawDur = (offer.duration ?? offer.estimated_duration_hours);
                        const d = Number(rawDur);
                        return Number.isFinite(d) ? `${d} hours` : '—';
                      })()}
                    </span>
                  </div>
                </div>
                
                {offer.message && (
                  <div className="repairer-message">
                    <strong>Repairer's Message:</strong>
                    <p>{offer.message}</p>
                  </div>
                )}
              </div>

              {offer.status === 'pending' ? (
                <div className="offer-actions">
                  <button 
                    className="btn-accept"
                    data-cy={`offer-accept-${offer.id}`}
                    onClick={async () => {
                      setProcessingOfferId(offer.id);
                      await handleAcceptOffer(offer.id);
                      setProcessingOfferId(null);
                    }}
                    disabled={processingOfferId === offer.id}
                  >
                    {processingOfferId === offer.id ? 'Traitement...' : 'Accepter'}
                  </button>
                  <button 
                    className="btn-reject"
                    data-cy={`offer-reject-${offer.id}`}
                    onClick={async () => {
                      setProcessingOfferId(offer.id);
                      await handleRejectOffer(offer.id);
                      setProcessingOfferId(null);
                    }}
                    disabled={processingOfferId === offer.id}
                  >
                    {processingOfferId === offer.id ? 'Traitement...' : 'Refuser'}
                  </button>
                </div>
              ) : offer.status === 'accepted' ? (
                <div className="offer-accepted-info" data-cy={`offer-accepted-${offer.id}`}>
                  ✓ You accepted this offer
                </div>
              ) : (
                <div className="offer-rejected-info" data-cy={`offer-rejected-${offer.id}`}>
                  ✗ You rejected this offer
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No offers found</p>
      )}
    </div>
  );
}
