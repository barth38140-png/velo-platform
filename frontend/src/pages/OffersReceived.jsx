import { useState, useEffect } from 'react';
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
  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => {
    if (user?.role === 'client') {
      loadReceivedOffers();
    }
  }, [user, filter]);

  const loadReceivedOffers = async () => {
    setLoading(true);
    try {
      const response = await repairOfferService.getClientOffers();
      console.log('Données reçues du backend :', response.data);
      let filtered = response.data.offers || [];

      if (filter !== 'all') {
        filtered = filtered.filter(offer => offer.status === filter);
      }
      console.log('Offres après filtrage :', filtered);
      console.log('État avant setOffers :', offers);
      setOffers(filtered);
      console.log('État après setOffers :', filtered);
    } catch (err) {
      console.error('Erreur lors du chargement des offres :', err);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      console.log('Tentative d\'acceptation de l\'offre avec ID :', offerId);
      await repairOfferService.acceptOffer(offerId);
      console.log('Offre acceptée avec succès, rechargement des offres...');
      await loadReceivedOffers();
      setSelectedOffer(null);
    } catch (err) {
      console.error('Erreur lors de l\'acceptation de l\'offre :', err);
      setError(err.response?.data?.error || 'Failed to accept offer');
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await repairOfferService.rejectOffer(offerId);
      await loadReceivedOffers();
      setSelectedOffer(null);
    } catch (err) {
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
            <div key={offer.id} className={`offer-card ${offer.status}`}>
              <div className="offer-header">
                <h3>{getRepairer(offer)}</h3>
                <span className={`status-badge ${offer.status}`}>
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
                <div className="offer-accepted-info">
                  ✓ You accepted this offer
                </div>
              ) : (
                <div className="offer-rejected-info">
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
