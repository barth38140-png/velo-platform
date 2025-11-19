import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { repairService, locationService, repairOfferService } from '../services/api';
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
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (user?.role === 'repairer') {
      // Load location is optional for proximity filtering
      // Skip it to avoid 404 errors if location not set
      // loadRepairerLocation();
      loadPendingRepairs();
    }
  }, [user]);

  const loadRepairerLocation = async () => {
    try {
      const response = await locationService.getLocation(user.id);
      setUserLocation(response.data.location);
    } catch (err) {
      // Location not found (404) — that's OK, user just hasn't set location yet
      // Continue without location filtering
      console.error('Failed to load location:', err);
      setUserLocation(null);
    }
  };

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
    } catch (err) {
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
    }
  };

  const repairsToShow = nearbyRepairs.length > 0 ? nearbyRepairs : repairs;

  return (
    <div className="explore-repairs">
      <h2>Available Repairs</h2>
      {error && <div className="error">{error}</div>}
      
      {loading ? (
        <p>Loading repairs...</p>
      ) : repairsToShow.length > 0 ? (
        <div className="repairs-grid">
          {repairsToShow.map(repair => (
            <div key={repair.id} className="repair-item">
              <h3>{repair.title}</h3>
              <p className="description">{repair.description}</p>
              <div className="repair-details">
                <span><strong>Type:</strong> {repair.bike_type}</span>
                <span><strong>Location:</strong> {repair.location_address}</span>
                <span><strong>Status:</strong> {repair.status}</span>
              </div>
              
              {selectedRepair?.id === repair.id ? (
                <form onSubmit={handleSubmitOffer} className="offer-form">
                  <div className="form-group">
                    <label>Your Quote (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={offerForm.price}
                      onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                      required
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
                    />
                  </div>
                  <div className="form-group">
                    <label>Message to Client</label>
                    <textarea
                      value={offerForm.message}
                      onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                      required
                      minLength="5"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit">Send Offer</button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedRepair(null)}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button 
                  onClick={() => setSelectedRepair(repair)}
                  className="offer-btn"
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
