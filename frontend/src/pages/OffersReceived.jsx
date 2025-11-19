import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { repairOfferService } from '../services/api';
import '../styles/OffersReceived.css';

export function OffersReceived() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      let filtered = response.data.offers || [];
      
      if (filter !== 'all') {
        filtered = filtered.filter(offer => offer.status === filter);
      }
      setOffers(filtered);
    } catch (err) {
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await repairOfferService.acceptOffer(offerId);
      await loadReceivedOffers();
      setSelectedOffer(null);
    } catch (err) {
      // Surface server error message when available for easier debugging
      console.error('acceptOffer error:', err);
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
      
      {error && <div className="error">{error}</div>}
      
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
        <p>Loading offers...</p>
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
                    <span className="value">€{parseFloat(offer.price || offer.offered_price || 0).toFixed(2)}</span>
                  </div>
                  <div className="quote-item">
                    <span className="label">Estimated Duration</span>
                    <span className="value">{offer.duration || offer.estimated_duration_hours || 0} hours</span>
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
                    onClick={() => handleAcceptOffer(offer.id)}
                  >
                    Accept Offer
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => handleRejectOffer(offer.id)}
                  >
                    Reject
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
