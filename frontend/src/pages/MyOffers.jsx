import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { repairOfferService } from '../services/api';
import '../styles/MyOffers.css';

export function MyOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected

  useEffect(() => {
    if (user?.role === 'repairer') {
      loadMyOffers();
    }
  }, [user, filter]);

  const loadMyOffers = async () => {
    setLoading(true);
    try {
      const response = await repairOfferService.getRepairerOffers();
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

  return (
    <div className="my-offers">
      <h2>My Repair Offers</h2>
      
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
                <p className="repair-description">{offer.repair_description}</p>
                
                <div className="offer-terms">
                  <span className="price">
                    <strong>Quote:</strong> €{parseFloat(offer.offered_price).toFixed(2)}
                  </span>
                  <span className="duration">
                    <strong>Duration:</strong> {offer.estimated_duration_hours}h
                  </span>
                </div>
                
                {offer.message && (
                  <div className="offer-message">
                    <strong>My Message:</strong>
                    <p>{offer.message}</p>
                  </div>
                )}
              </div>

              {offer.status === 'pending' && (
                <div className="offer-actions">
                  <p className="info-text">Waiting for client decision...</p>
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
    </div>
  );
}
