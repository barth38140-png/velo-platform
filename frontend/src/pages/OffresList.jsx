// Mapping statut (base sans accent → affichage avec accent)
const statutLibelle = {
  cree: 'Créée',
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  terminee: 'Terminée',
  annulee: 'Annulée',
  proposed: 'Proposée',
  accepted: 'Acceptée',
  rejected: 'Rejetée',
  // fallback pour anciens statuts
  pending: 'Créée',
  assigned: 'En attente',
  cancelled: 'Annulée',
  'créée': 'Créée'
};
import React, { useEffect, useState, useCallback } from 'react';
import { repairOfferService } from '../services/api';
import { useToast } from '../context/ToastContext';
import DateNegotiationModal from '../components/DateNegotiationModal';

export default function OffresList({ selectedRepair }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const [sortBy, setSortBy] = useState('price-asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDateModal, setShowDateModal] = useState(null); // ID de l'offre pour laquelle afficher le modal
  const toast = useToast();
  const prevOffersRef = React.useRef('');

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Only load offers for the selected repair to keep UI focused and avoid mixing
      if (!selectedRepair) {
        setOffers([]);
        return;
      }

      const resp = await repairOfferService.getOffersForRepair(selectedRepair.id);
      const raw = resp?.data?.offers || [];
      // Normalize different backend field names (some endpoints alias columns differently)
      const normalized = raw.map(o => ({
        id: o.id,
        repair_request_id: o.repair_request_id || o.repairId || null,
        repairer_id: o.repairer_id,
        repairer_name: o.repairer_name || o.repairer || 'Réparateur',
        price: o.offered_price || o.price || o.price_offered || null,
        duration: o.estimated_duration_hours || o.duration || null,
        message: o.message || '',
        // Dates d'intervention proposées (si disponibles côté backend)
        scheduled_from: o.scheduled_from || o.intervention_date || null,
        scheduled_to: o.scheduled_to || null,
        // Map backend ASCII statuses to French labels for UI
        status: (() => {
          const s = o.status || 'proposed';
          if (s === 'proposed') return 'proposée';
          if (s === 'accepted') return 'acceptée';
          if (s === 'rejected') return 'rejetée';
          return s;
        })(),
        created_at: o.created_at,
        skills: o.skills || ''
      }));
			
      // ⚡ Éviter mises à jour inutiles si les offres n'ont pas changé
      const nextIds = normalized.map(o => `${o.id}-${o.status}`).join(',');
      if (prevOffersRef.current !== nextIds) {
        prevOffersRef.current = nextIds;
        setOffers(normalized);
      }
    } catch (err) {
      // Utiliser le logger Pino côté backend pour les erreurs de chargement d'offres
      setError(err?.response?.data?.error || 'Impossible de charger les offres');
    } finally {
      setLoading(false);
    }
  }, [selectedRepair]);	useEffect(() => { loadOffers(); }, [loadOffers]);

  useEffect(() => {
    const handler = (e) => { try { loadOffers(); } catch { } };
    window.addEventListener('offerStatusChanged', handler);
    window.addEventListener('repairCreated', handler);
    return () => { window.removeEventListener('offerStatusChanged', handler); window.removeEventListener('repairCreated', handler); };
  }, [loadOffers]);

  const handleAccept = async (id) => {
    setProcessing(id);
    try {
      await repairOfferService.acceptOffer(id);
      toast.success('✅ Offre acceptée !');
      await loadOffers();
      // notify other components (eg. DemandesList) to refresh their data
      try { window.dispatchEvent(new CustomEvent('offerStatusChanged', { detail: { offerId: id, repairId: selectedRepair?.id, status: 'acceptée' } })); } catch (e) { /* ignore */ }
    } catch (err) {
      // Utiliser le logger Pino côté backend pour les erreurs d'acceptation d'offre
      const errorMsg = err?.response?.data?.error || 'Impossible d\'accepter l\'offre';
      setError(errorMsg);
      toast.error('❌ ' + errorMsg);
    } finally { setProcessing(null); }
  };

  const handleReject = async (id) => {
    setProcessing(id);
    try {
      await repairOfferService.rejectOffer(id);
      toast.info('Offre rejetée');
      await loadOffers();
      try { window.dispatchEvent(new CustomEvent('offerStatusChanged', { detail: { offerId: id, repairId: selectedRepair?.id, status: 'rejetée' } })); } catch (e) { /* ignore */ }
    } catch (err) {
      // Utiliser le logger Pino côté backend pour les erreurs de rejet d'offre
      const errorMsg = err?.response?.data?.error || 'Impossible de refuser l\'offre';
      setError(errorMsg);
      toast.error('❌ ' + errorMsg);
    } finally { setProcessing(null); }
  };

  const handleProposeDate = async (offerId, scheduledFrom, scheduledTo) => {
    await repairOfferService.proposeDate(offerId, scheduledFrom, scheduledTo);
    toast.success('📅 Date proposée au réparateur');
    setShowDateModal(null);
    await loadOffers();
  };

  const handleConfirmDate = async (offerId) => {
    await repairOfferService.confirmDate(offerId);
    toast.success('✅ Date confirmée ! Vous pouvez maintenant accepter l\'offre');
    setShowDateModal(null);
    await loadOffers();
  };

  // Filtrage et tri des offres
  const filteredAndSorted = React.useMemo(() => {
    let result = [...offers];
		
    // Filtrage par statut
    if (filterStatus !== 'all') {
      result = result.filter(o => o.status === filterStatus);
    }
		
    // Tri
    switch (sortBy) {
    case 'price-asc':
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'price-desc':
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'duration-asc':
      result.sort((a, b) => (a.duration || 0) - (b.duration || 0));
      break;
    case 'date-desc':
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    default:
      break;
    }
		
    return result;
  }, [offers, sortBy, filterStatus]);

  return (
    <div className="offres-list" aria-live="polite">
      {/* N'afficher une erreur que lorsqu'une demande est sélectionnée */}
      {selectedRepair && error && <div className="error-toast small">{error}</div>}
			
      {/* Contrôles de filtrage et tri (seulement si offres disponibles) */}
      {selectedRepair && offers.length > 0 && (
        <div className="list-controls">
          <div className="filter-group">
            <label htmlFor="offer-status-filter">Statut:</label>
            <select 
              id="offer-status-filter"
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Toutes ({offers.length})</option>
              <option value="proposée">💼 Proposée ({offers.filter(o => o.status === 'proposée').length})</option>
              <option value="acceptée">✅ Acceptée ({offers.filter(o => o.status === 'acceptée').length})</option>
              <option value="rejetée">❌ Rejetée ({offers.filter(o => o.status === 'rejetée').length})</option>
            </select>
          </div>
          <div className="sort-group">
            <label htmlFor="offer-sort-select">Trier par:</label>
            <select 
              id="offer-sort-select"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="price-asc">💰 Prix croissant</option>
              <option value="price-desc">💰 Prix décroissant</option>
              <option value="duration-asc">⏱️ Durée la plus courte</option>
              <option value="date-desc">📅 Plus récente</option>
            </select>
          </div>
        </div>
      )}
			
      {loading ? <div className="loader-sm">Chargement...</div> : (
      // If no repair is selected prompt the user to choose one
        !selectedRepair ? null : filteredAndSorted.length === 0 ? (
          <div className="empty-list">
            {offers.length === 0 ? 'Aucune offre pour cette demande' : `Aucune offre avec le statut "${filterStatus}"`}
          </div>
        ) : (
          <div className="offers-grid">
            {filteredAndSorted.map(o => {
              const priceStr = o.price != null ? `€${Number(o.price).toFixed(2)}` : '—';
              const durStr = o.duration != null ? `${o.duration} h` : '—';
              const dateStr = o.scheduled_from ? new Date(o.scheduled_from).toLocaleString() : null;
              const compat = (o.skills && selectedRepair && selectedRepair.bike_type) ? (o.skills.includes(selectedRepair.bike_type) ? 'Compatible' : 'Vérifier') : '—';
              return (
                <div key={o.id} className={`offer-card ${o.status}`}>
                  <div className="offer-head">
                    <strong>{o.repairer_name || 'Réparateur'}</strong>
                    <span className={`badge ${o.status}`}>{statutLibelle[o.status] || o.status}</span>
                  </div>
                  <div className="offer-body">
                    <div><strong>Prix:</strong> {priceStr}</div>
                    <div><strong>Durée:</strong> {durStr}</div>
                    {dateStr && (
                      <div>
                        <strong>Date d'intervention:</strong> {dateStr}
                        {o.date_status === 'confirmed' && <span className="badge confirmed" style={{marginLeft: 8}}>✅ Confirmée</span>}
                        {o.date_status === 'proposed_by_repairer' && <span className="badge pending" style={{marginLeft: 8}}>⏳ Proposée par réparateur</span>}
                        {o.date_status === 'proposed_by_client' && <span className="badge pending" style={{marginLeft: 8}}>⏳ Votre proposition</span>}
                      </div>
                    )}
                    <div><strong>Compatibilité:</strong> {compat}</div>
                    {o.message && <div className="offer-msg">{o.message}</div>}
                  </div>
                  <div className="offer-actions">
                    {o.status === 'proposée' && (
                      <>
                        {o.date_status !== 'confirmed' && (
                          <button 
                            className="btn secondary small" 
                            onClick={() => setShowDateModal(o.id)} 
                            style={{marginBottom: 8, width: '100%'}}
                          >
														📅 {o.scheduled_from ? 'Négocier la date' : 'Proposer une date'}
                          </button>
                        )}
                        {o.date_status === 'confirmed' ? (
                          <>
                            <button className="btn accept small" onClick={() => handleAccept(o.id)} disabled={processing === o.id}>{processing === o.id ? '...' : 'Accepter'}</button>
                            <button className="btn danger small" onClick={() => handleReject(o.id)} disabled={processing === o.id} style={{marginLeft:8}}>Refuser</button>
                          </>
                        ) : (
                          <div className="muted" style={{fontSize: '0.85rem', padding: '0.5rem', background: '#fff3cd', borderRadius: '4px'}}>
														⚠️ Confirmez d'abord une date d'intervention avant d'accepter l'offre
                          </div>
                        )}
                      </>
                    )}
                    {o.status === 'acceptée' && <div className="muted">Offre acceptée</div>}
                    {o.status === 'rejetée' && <div className="muted">Offre rejetée</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal de négociation de dates */}
      {showDateModal && (
        <DateNegotiationModal
          offer={offers.find(o => o.id === showDateModal)}
          onClose={() => setShowDateModal(null)}
          onDateProposed={(from, to) => handleProposeDate(showDateModal, from, to)}
          onDateConfirmed={() => handleConfirmDate(showDateModal)}
          isClient={true}
        />
      )}
    </div>
  );
}

