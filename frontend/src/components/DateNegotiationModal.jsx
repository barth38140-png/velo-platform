// frontend/src/components/DateNegotiationModal.jsx
import { useState } from 'react';
import '../styles/DateNegotiationModal.css';

/**
 * Modal pour négocier les dates d'intervention entre client et réparateur
 * @param {Object} offer - L'offre concernée
 * @param {Function} onClose - Fonction appelée à la fermeture
 * @param {Function} onDateProposed - Callback après proposition de date
 * @param {Function} onDateConfirmed - Callback après confirmation de date
 * @param {boolean} isClient - true si l'utilisateur est le client, false si réparateur
 */
export default function DateNegotiationModal({ offer, onClose, onDateProposed, onDateConfirmed, isClient }) {
  const [scheduledFrom, setScheduledFrom] = useState(
    offer.scheduled_from ? new Date(offer.scheduled_from).toISOString().slice(0, 16) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculer automatiquement la date de fin selon la durée de l'offre
  const calculateScheduledTo = (fromDate) => {
    if (!fromDate || !offer.duration) return null;
    const start = new Date(fromDate);
    const durationHours = Number(offer.duration) || Number(offer.estimated_duration_hours) || 1;
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return end.toISOString();
  };

  // Déterminer l'état de la négociation
  const hasProposedDate = offer.scheduled_from;
  const dateStatus = offer.date_status || 'pending';
  const proposedBy = offer.proposed_by;
  const isMyProposal = (isClient && proposedBy === 'client') || (!isClient && proposedBy === 'repairer');
  const canConfirm = hasProposedDate && !isMyProposal && dateStatus !== 'confirmed';
  const canPropose = dateStatus !== 'confirmed';

  const handleProposeDate = async (e) => {
    e.preventDefault();
    
    if (!scheduledFrom) {
      setError('La date de début est requise');
      return;
    }

    const fromDate = new Date(scheduledFrom);
    if (isNaN(fromDate.getTime())) {
      setError('Date de début invalide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calculer automatiquement la date de fin selon la durée
      const calculatedTo = calculateScheduledTo(scheduledFrom);
      await onDateProposed(scheduledFrom, calculatedTo);
      // onClose sera appelé par le parent après succès
    } catch (err) {
      setError(err?.response?.data?.error || 'Erreur lors de la proposition de date');
      setLoading(false);
    }
  };

  const handleConfirmDate = async () => {
    setLoading(true);
    setError('');

    try {
      await onDateConfirmed();
      // onClose sera appelé par le parent après succès
    } catch (err) {
      setError(err?.response?.data?.error || 'Erreur lors de la confirmation de la date');
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="date-negotiation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 Date d'intervention</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {dateStatus === 'confirmed' && (
            <div className="alert alert-success">
              ✅ Date confirmée par les deux parties
            </div>
          )}

          {hasProposedDate && dateStatus !== 'confirmed' && (
            <div className={`date-proposal ${isMyProposal ? 'my-proposal' : 'their-proposal'}`}>
              <h3>
                {isMyProposal ? '📤 Votre proposition' : '📥 Proposition reçue'}
              </h3>
              <div className="proposed-dates">
                <p><strong>Début :</strong> {formatDateTime(offer.scheduled_from)}</p>
                {offer.scheduled_to && (
                  <p><strong>Fin :</strong> {formatDateTime(offer.scheduled_to)}</p>
                )}
              </div>

              {canConfirm && (
                <div className="confirm-actions">
                  <p className="info-text">
                    Cette date vous convient-elle ?
                  </p>
                  <button 
                    className="btn btn-success"
                    onClick={handleConfirmDate}
                    disabled={loading}
                  >
                    {loading ? 'Confirmation...' : '✅ Confirmer cette date'}
                  </button>
                  <p className="small-text">
                    Ou proposez une autre date ci-dessous
                  </p>
                </div>
              )}
            </div>
          )}

          {canPropose && (
            <form onSubmit={handleProposeDate} className="date-form">
              <h3>
                {hasProposedDate ? '🔄 Contre-proposer une date' : '📆 Proposer une date'}
              </h3>

              <div className="form-group">
                <label htmlFor="scheduled_from">
                  Date et heure de début <span className="required">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="scheduled_from"
                  value={scheduledFrom}
                  onChange={(e) => setScheduledFrom(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  disabled={loading}
                />
              </div>

              {scheduledFrom && offer.duration && (
                <div className="form-group">
                  <label>Durée estimée</label>
                  <div className="calculated-duration">
                    ⏱️ {offer.duration || offer.estimated_duration_hours} heure(s)
                    {calculateScheduledTo(scheduledFrom) && (
                      <span className="end-time">
                        {' → Fin prévue : '}
                        {new Date(calculateScheduledTo(scheduledFrom)).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  <small className="help-text">
                    La date de fin est calculée automatiquement selon la durée de l'offre
                  </small>
                </div>
              )}

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Envoi...' : hasProposedDate ? 'Contre-proposer' : 'Proposer'}
                </button>
              </div>
            </form>
          )}

          {dateStatus === 'confirmed' && (
            <div className="confirmed-info">
              <p className="info-text">
                💡 Vous pouvez maintenant accepter l'offre
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
