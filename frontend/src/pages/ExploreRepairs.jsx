import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { repairService, repairOfferService } from '../services/api';
import '../styles/ExploreRepairs.css';

export function ExploreRepairs() {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState([]);
  const [nearbyRepairs, setNearbyRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [offerForm, setOfferForm] = useState({
    price: '',
    duration: '',
    message: ''
  });
  const [sendingOffer, setSendingOffer] = useState(false);
  const userLocation = null; // optional location disabled for now

  useEffect(() => {
    if (user?.role === 'repairer') {
      // Load location is optional for proximity filtering
      // Skip it to avoid 404 errors if location not set
      // loadRepairerLocation();
      loadPendingRepairs();
    }
  }, [user]);

  // loadRepairerLocation removed — optional location fetching disabled for stability

  const loadPendingRepairs = async () => {
    setLoading(true);
    try {
      const response = await repairService.getPendingRepairs();
      setRepairs(response.data.repairs || []);
      
      // Filter nearby repairs if we have location
      if (userLocation) {
        const nearby = response.data.repairs.filter((repair) => {
          const dist = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            repair.location_lat,
            repair.location_lng
          );
          return dist <= 20;
        });
        setNearbyRepairs(nearby);
      }
    } catch {
      setError('Failed to load repairs');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setError('');
    setSendingOffer(true);
    try {
      await repairOfferService.createOffer(
        selectedRepair.id,
        parseFloat(offerForm.price),
        parseInt(offerForm.duration),
        offerForm.message
      );
      setOfferForm({ price: '', duration: '', message: '' });
      setSelectedRepair(null);
      await loadPendingRepairs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit offer');
    } finally {
      setSendingOffer(false);
    }
  };

  const repairsToShow = nearbyRepairs.length > 0 ? nearbyRepairs : repairs;

  return (
    <div className="explore-repairs">
      <h2>Available Repairs</h2>
      {error && <div className="error-toast">{error}</div>}

      {loading ? (
        <div className="spinner"><div className="loader"></div> Chargement des réparations...</div>
      ) : repairsToShow.length > 0 ? (
        <div className="repairs-grid">
          {repairsToShow.map(repair => (
            <div key={repair.id} className="repair-item" data-cy={`repair-item-${repair.id}`}>
              <h3 data-cy={`repair-title-${repair.id}`}>{repair.title}</h3>
              <p className="description" data-cy={`repair-desc-${repair.id}`}>{repair.description}</p>
              <div className="repair-details">
                <span><strong>Type:</strong> {repair.bike_type}</span>
                <span><strong>Location:</strong> {repair.location_address}</span>
                <span><strong>Status:</strong> {repair.status}</span>
              </div>
              
              {selectedRepair?.id === repair.id ? (
                <form onSubmit={handleSubmitOffer} className="offer-form" data-cy={`offer-form-${repair.id}`}>
                  <div className="form-group">
                    <label>Your Quote (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={offerForm.price}
                      onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                      required
                      data-cy={`offer-price-${repair.id}`}
                    />
                  </div>
                  <div className="form-group">
                    <label>Estimated Duration (hours)</label>
                    <input
                      type="number"
                      min="1"
                      value={offerForm.duration}
                      onChange={(e) => setOfferForm({ ...offerForm, duration: e.target.value })}
                      required
                      data-cy={`offer-duration-${repair.id}`}
                    />
                  </div>
                  <div className="form-group">
                    <label>Message to Client</label>
                    <textarea
                      value={offerForm.message}
                      onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                      required
                      minLength="5"
                      data-cy={`offer-message-${repair.id}`}
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" disabled={sendingOffer} data-cy={`offer-submit-${repair.id}`}>
                      {sendingOffer ? 'Envoi en cours...' : 'Envoyer l’offre'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedRepair(null)}
                      className="cancel-btn"
                      disabled={sendingOffer}
                      data-cy={`offer-cancel-${repair.id}`}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <button 
                  onClick={() => setSelectedRepair(repair)}
                  className="offer-btn"
                  data-cy={`offer-open-${repair.id}`}
                >
                  Submit Offer
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No available repairs in your area</p>
      )}
    </div>
  );
}
