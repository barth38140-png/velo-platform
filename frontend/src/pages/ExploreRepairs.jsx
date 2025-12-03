import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { repairService, repairOfferService, conversationService } from '../services/api';
import { socket } from '../services/socket';
import '../styles/ExploreRepairs.css';
import '../styles/Modal.css';

export function ExploreRepairs() {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState([]);
  const [nearbyRepairs, setNearbyRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedRepairId, setExpandedRepairId] = useState(null);
  const [offerForm, setOfferForm] = useState({
    price: '',
    duration: '',
    message: '',
    scheduledFrom: '',
    scheduledTo: ''
  });
  const [sendingOffer, setSendingOffer] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingContact, setSendingContact] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const userLocation = null;
  const renderCount = useRef(0);
  const hasInteracted = useRef(false);

  const loadPendingRepairs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await repairService.getPendingRepairs();
      const items = response.data.repairs || [];

      // Éviter les mises à jour visuelles si la liste n'a pas changé
      const prevIds = (repairs || []).map(r => r.id).join(',');
      const nextIds = items.map(r => r.id).join(',');
      const hasChanged = prevIds !== nextIds;

      if (hasChanged) {
        setRepairs(items);
      }
      
      if (userLocation) {
        const nearby = items.filter((repair) => {
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

      if (hasChanged) {
        setLastUpdated(new Date());
      }
    } catch (err) {
      // Ne pas afficher d'erreur bloquante au chargement initial
      // Si 404/empty: considérer comme liste vide
      if (err?.response?.status === 404) {
        setRepairs([]);
        setNearbyRepairs([]);
        setLastUpdated(new Date());
      } else {
        // ⚠️ Supprime le retry agressif toutes les ~1s pour éviter rafraîchissement permanent
        // L'actualisation se fera via focus ou événements socket.
      }
    } finally {
      setLoading(false);
    }
  }, [userLocation, repairs]);

  // Rafraîchissement au fur et à mesure des interactions utilisateur
  // Ici: lorsqu'on revient sur la fenêtre (focus), on recharge discrètement
  useEffect(() => {
    function onFocus() {
      // Ne charger que si l'utilisateur a déjà interagi avec la page
      if (hasInteracted.current && user?.role === 'repairer') {
        loadPendingRepairs();
      }
    }
    
    // Marquer comme "interagi" après un délai (pour ignorer le focus initial)
    const timer = setTimeout(() => {
      hasInteracted.current = true;
    }, 1000);
    
    window.addEventListener('focus', onFocus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.role, loadPendingRepairs]);

  // Rafraîchissement en temps réel via Socket.io
  useEffect(() => {
    if (!socket) return;
    // Quand une offre est créée/mise à jour, rafraîchir la liste pour masquer les demandes déjà répondues
    let refreshScheduled = false;
    const scheduleRefresh = () => {
      if (refreshScheduled) return;
      refreshScheduled = true;
      setTimeout(() => {
        refreshScheduled = false;
        if (user?.role === 'repairer') {
          loadPendingRepairs();
        }
      }, 600);
    };
    const onOfferUpdate = (payload) => {
      // Payload attendu: { repair_request_id, offer_id, action }
      // On recharge discrètement la liste si l'utilisateur est réparateur
      scheduleRefresh();
    };
    // Quand le statut d'une demande évolue (acceptée/assignée/en_cours/etc.), rafraîchir
    const onStatusUpdate = (payload) => { scheduleRefresh(); };

    try {
      socket.on('offer_update', onOfferUpdate);
      socket.on('status_update', onStatusUpdate);
    } catch (e) {
      // ignorer si socket non dispo
    }
    return () => {
      try {
        socket.off('offer_update', onOfferUpdate);
        socket.off('status_update', onStatusUpdate);
      } catch {
        // ignore
      }
    };
  }, [user?.role, loadPendingRepairs]);

  // Chargement initial discret pour les réparateurs
  // Déclenché une fois après un court délai pour éviter les effets StrictMode
  useEffect(() => {
    if (user?.role === 'repairer') {
      const initialTimer = setTimeout(() => {
        hasInteracted.current = true;
        loadPendingRepairs();
      }, 400);
      return () => clearTimeout(initialTimer);
    }
  }, [user?.role, loadPendingRepairs]);

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

  const openDetail = (repair) => {
    setSelectedRepair(repair);
    setShowDetailModal(true);
    setOfferForm({
      price: offerForm.price || '30.00',
      duration: offerForm.duration || '1',
      message: offerForm.message || `Bonjour ${repair?.client_name || ''}, je peux intervenir rapidement sur "${repair?.title}". Voici mon devis initial.`,
      scheduledFrom: '',
      scheduledTo: ''
    });
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedRepair(null);
    setOfferForm({ price: '30.00', duration: '1', message: 'Bonjour, je peux intervenir rapidement. Voici mon devis initial.', scheduledFrom: '', scheduledTo: '' });
    setContactMessage('');
  };

  const handleContactClient = async () => {
    if (!selectedRepair) return;
    const initialMsg = contactMessage && contactMessage.trim().length > 0
      ? contactMessage.trim()
      : `Bonjour ${selectedRepair?.client_name || ''}, pouvez-vous préciser le besoin pour "${selectedRepair?.title}" ?`;
    setError('');
    setSuccessMessage('');
    setSendingContact(true);
    try {
      // Le backend attend (repairerId, repairRequestId). On utilise l'id du réparateur courant et l'id de la demande.
      const conv = await conversationService.createConversation(user?.id, selectedRepair.id);
      const convId = conv?.data?.id || conv?.data?.conversationId;
      if (convId) {
        await conversationService.sendMessage(convId, initialMsg);
        setSuccessMessage('✅ Message envoyé au client. Vous pouvez poursuivre la discussion.');
        setContactMessage('');
        try {
          window.dispatchEvent(new CustomEvent('openMessages', { detail: { conversationId: convId } }));
        } catch {}
      } else {
        setError('❌ Impossible de démarrer la discussion pour cette demande.');
      }
    } catch (e) {
      setError('❌ Échec de l\'envoi du message. Réessayez.');
    } finally {
      setSendingContact(false);
    }
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const errs = {};
    const priceNum = Number(offerForm.price);
    const durNum = Number(offerForm.duration);
    if (!Number.isFinite(priceNum) || priceNum < 0.01) errs.price = 'Le prix doit être au moins 0,01€';
    if (!Number.isInteger(durNum) || durNum < 1) errs.duration = 'La durée doit être un entier ≥ 1';
    if (!offerForm.message || offerForm.message.trim().length < 5) errs.message = 'Le message doit contenir au moins 5 caractères';
    if (offerForm.scheduledFrom && offerForm.scheduledTo) {
      const from = new Date(offerForm.scheduledFrom);
      const to = new Date(offerForm.scheduledTo);
      if (!isFinite(from.getTime()) || !isFinite(to.getTime())) {
        errs.scheduled = 'Dates d\'intervention invalides';
      } else if (to < from) {
        errs.scheduled = 'La fin doit être postérieure au début';
      }
    }
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (sendingOffer) return;
    setSendingOffer(true);
    try {
      const response = await repairOfferService.createOffer(
        Number(selectedRepair.id),
        parseFloat(offerForm.price),
        parseInt(offerForm.duration, 10),
        offerForm.message,
        offerForm.scheduledFrom && offerForm.scheduledFrom.trim() ? new Date(offerForm.scheduledFrom).toISOString() : null,
        offerForm.scheduledTo && offerForm.scheduledTo.trim() ? new Date(offerForm.scheduledTo).toISOString() : null
      );
      setSuccessMessage(`✅ Offre envoyée avec succès pour "${selectedRepair.title}" !`);
      setOfferForm({ price: '30.00', duration: '1', message: 'Bonjour, je peux intervenir rapidement. Voici mon devis initial.', scheduledFrom: '', scheduledTo: '' });
      setFormErrors({});
      setTimeout(() => {
        setSuccessMessage('');
        closeDetail();
      }, 2000);
      await loadPendingRepairs();
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const vErrs = {};
        data.errors.forEach((e) => {
          if (e?.field && e?.message) vErrs[e.field] = e.message;
        });
        setFormErrors(vErrs);
        setError('❌ Des champs sont invalides. Veuillez corriger et réessayer.');
      } else if (data?.error) {
        setError(`❌ ${data.error}`);
      } else {
        setError('❌ Échec de l\'envoi de l\'offre. Veuillez réessayer.');
      }
    } finally {
      setSendingOffer(false);
    }
  };

  const repairsToShow = nearbyRepairs.length > 0 ? nearbyRepairs : repairs;
  const sortedRepairs = React.useMemo(() => {
    const arr = [...repairsToShow];
    switch (sortBy) {
      case 'date_desc':
        return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'date_asc':
        return arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'type':
        return arr.sort((a, b) => String(a.bike_type || '').localeCompare(String(b.bike_type || '')));
      default:
        return arr;
    }
  }, [repairsToShow, sortBy]);

  return (
    <div className="explore-repairs">
      <h2>Available Repairs</h2>
      {lastUpdated && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span className="muted" aria-live="polite">Dernière mise à jour: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      )}
      {/* Pas d'erreur visuelle au montage pour éviter bruit UX */}

      <div className="actions-bar" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <label htmlFor="sort-select" className="muted">Trier</label>
        <select id="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date_desc">Date ↓</option>
          <option value="date_asc">Date ↑</option>
          <option value="type">Type de vélo</option>
        </select>
      </div>

      {loading ? (
        <div className="spinner"><div className="loader"></div> Chargement des réparations...</div>
      ) : sortedRepairs.length > 0 ? (
        <div className="repairs-grid">
          {sortedRepairs.map(repair => (
            <div 
              key={repair.id} 
              className="repair-item" 
              data-cy={'repair-item-' + repair.id}
              style={{ cursor: 'default' }}
            >
              <h3 data-cy={'repair-title-' + repair.id}>{repair.title}</h3>
              <p className="description" data-cy={'repair-desc-' + repair.id}>{repair.description}</p>
              <div className="repair-details">
                <span><strong>Type:</strong> {repair.bike_type}</span>
                <span><strong>Location:</strong> {repair.location_address}</span>
              </div>
              <div className="repair-actions" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setExpandedRepairId(expandedRepairId === repair.id ? null : repair.id);
                    setSelectedRepair(repair);
                    setOfferForm({
                      price: offerForm.price || '30.00',
                      duration: offerForm.duration || '1',
                      message: offerForm.message || `Bonjour ${repair?.client_name || ''}, je peux intervenir rapidement sur "${repair?.title}". Voici mon devis initial.`,
                      scheduledFrom: '',
                      scheduledTo: ''
                    });
                    setContactMessage('');
                  }}
                  data-cy={'toggle-offer-form-' + repair.id}
                >
                  Proposer une offre
                </button>
              </div>

              {expandedRepairId === repair.id && (
                <div className="inline-offer-form" style={{ marginTop: 12 }}>
                  {/* Bloc de contact pour échanger avant l'offre */}
                  <div className="contact-client" style={{ padding: '10px', border: '1px solid #eee', borderRadius: 6, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Discuter avec le client</strong>
                      <button type="button" className="secondary" onClick={handleContactClient} disabled={sendingContact} aria-label="Contact Client">
                        {sendingContact ? 'Envoi...' : 'Envoyer un message'}
                      </button>
                    </div>
                    <textarea
                      placeholder="Demandez des précisions (ex: photos, disponibilité, détails du problème)"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows="3"
                      style={{ width: '100%', marginTop: 8 }}
                    />
                  </div>

                  {successMessage && (
                    <div className="success-message" style={{ padding: '12px', marginBottom: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', border: '1px solid #c3e6cb' }}>
                      {successMessage}
                    </div>
                  )}
                  {error && (
                    <div className="error-message" style={{ padding: '12px', marginBottom: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', border: '1px solid #f5c6cb' }}>
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmitOffer} className="offer-form">
                    <div className="form-group">
                      <label>Votre devis (EUR)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={offerForm.price}
                        onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                        required
                        data-cy={'offer-price-' + repair.id}
                      />
                      {formErrors.price && <div className="field-error">{formErrors.price}</div>}
                    </div>
                    <div className="form-group">
                      <label>Durée estimée (heures)</label>
                      <input
                        type="number"
                        min="1"
                        value={offerForm.duration}
                        onChange={(e) => setOfferForm({ ...offerForm, duration: e.target.value })}
                        required
                        data-cy={'offer-duration-' + repair.id}
                      />
                      {formErrors.duration && <div className="field-error">{formErrors.duration}</div>}
                    </div>
                    <div className="form-group">
                      <label>Date de début d'intervention</label>
                      <input
                        type="datetime-local"
                        value={offerForm.scheduledFrom}
                        onChange={(e) => setOfferForm({ ...offerForm, scheduledFrom: e.target.value })}
                        data-cy={'offer-scheduled-from-' + repair.id}
                      />
                    </div>
                    <div className="form-group">
                      <label>Date de fin d'intervention</label>
                      <input
                        type="datetime-local"
                        value={offerForm.scheduledTo}
                        onChange={(e) => setOfferForm({ ...offerForm, scheduledTo: e.target.value })}
                        data-cy={'offer-scheduled-to-' + repair.id}
                      />
                      {formErrors.scheduled && <div className="field-error">{formErrors.scheduled}</div>}
                    </div>
                    <div className="form-group">
                      <label>Message au client</label>
                      <textarea
                        value={offerForm.message}
                        onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                        required
                        minLength="5"
                        rows="4"
                        data-cy={'offer-message-' + repair.id}
                      />
                      {formErrors.message && <div className="field-error">{formErrors.message}</div>}
                    </div>
                    <div className="form-actions">
                      <button type="submit" disabled={sendingOffer || Object.keys(formErrors).length > 0} data-cy={'offer-submit-' + repair.id} aria-label="Submit Offer">
                        {sendingOffer ? 'Envoi en cours...' : 'Envoyer l\'offre'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedRepairId(null)}
                        className="cancel-btn"
                        disabled={sendingOffer}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>Aucune réparation disponible dans votre zone</p>
      )}

      {showDetailModal && selectedRepair && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeDetail}>&times;</button>
            
            <div className="repair-detail-view">
              <h2>{selectedRepair.title}</h2>
              
              <div className="detail-section">
                <h3>Description</h3>
                <p>{selectedRepair.description}</p>
              </div>

              <div className="detail-section">
                <h3>Informations</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Type de vélo:</strong>
                    <span>{selectedRepair.bike_type || 'Non spécifié'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Lieu:</strong>
                    <span>{selectedRepair.location_address || 'Non spécifié'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Statut:</strong>
                    <span>{selectedRepair.status}</span>
                  </div>
                  {selectedRepair.metadata?.problem && (
                    <div className="info-item">
                      <strong>Problème:</strong>
                      <span>{selectedRepair.metadata.problem}</span>
                    </div>
                  )}
                  {selectedRepair.metadata?.subNeed && (
                    <div className="info-item">
                      <strong>Détail:</strong>
                      <span>{selectedRepair.metadata.subNeed}</span>
                    </div>
                  )}
                  {selectedRepair.metadata?.note && (
                    <div className="info-item">
                      <strong>Note:</strong>
                      <span>{selectedRepair.metadata.note}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Soumettre une offre</h3>
                <form onSubmit={handleSubmitOffer} className="offer-form">
                  <div className="form-group">
                    <label>Votre devis (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={offerForm.price}
                      onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                      required
                      data-cy={'offer-price-' + selectedRepair.id}
                    />
                  </div>
                  <div className="form-group">
                    <label>Durée estimée (heures)</label>
                    <input
                      type="number"
                      min="1"
                      value={offerForm.duration}
                      onChange={(e) => setOfferForm({ ...offerForm, duration: e.target.value })}
                      required
                      data-cy={'offer-duration-' + selectedRepair.id}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date de début d'intervention</label>
                    <input
                      type="datetime-local"
                      value={offerForm.scheduledFrom}
                      onChange={(e) => setOfferForm({ ...offerForm, scheduledFrom: e.target.value })}
                      data-cy={'offer-scheduled-from-' + selectedRepair.id}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date de fin d'intervention</label>
                    <input
                      type="datetime-local"
                      value={offerForm.scheduledTo}
                      onChange={(e) => setOfferForm({ ...offerForm, scheduledTo: e.target.value })}
                      data-cy={'offer-scheduled-to-' + selectedRepair.id}
                    />
                  </div>
                  <div className="form-group">
                    <label>Message au client</label>
                    <textarea
                      value={offerForm.message}
                      onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                      required
                      minLength="5"
                      rows="4"
                      data-cy={'offer-message-' + selectedRepair.id}
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" disabled={sendingOffer} data-cy={'offer-submit-' + selectedRepair.id} aria-label="Submit Offer">
                      {sendingOffer ? 'Envoi en cours...' : 'Envoyer l\'offre'}
                    </button>
                    <button
                      type="button"
                      onClick={closeDetail}
                      className="cancel-btn"
                      disabled={sendingOffer}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExploreRepairs;
