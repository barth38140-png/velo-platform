import React, { useState } from 'react';
import '../styles/ReviewModal.css';

/**
 * Modal pour soumettre un avis sur une réparation terminée
 * @param {object} repair - Réparation à noter
 * @param {function} onSubmit - Callback après soumission réussie
 * @param {function} onClose - Fermer la modal
 */
export default function ReviewModal({ repair, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          repair_request_id: repair.id,
          rating,
          comment: comment.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la soumission');
      }

      const data = await response.json();
      onSubmit && onSubmit(data.review);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
        onClick={() => setRating(star)}
        onMouseEnter={() => setHoverRating(star)}
        onMouseLeave={() => setHoverRating(0)}
        role="button"
        tabIndex={0}
        aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Fermer">
          &times;
        </button>

        <h2>Noter cette réparation</h2>
        
        <div className="repair-summary">
          <h3>{repair.title}</h3>
          <p className="repairer-name">
            Réparé par : <strong>{repair.repairer_name || 'Réparateur'}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Votre note</label>
            <div className="stars-container">
              {renderStars()}
            </div>
            <p className="rating-label">
              {rating > 0 && (
                <span>
                  {rating === 1 && 'Très mauvais'}
                  {rating === 2 && 'Mauvais'}
                  {rating === 3 && 'Moyen'}
                  {rating === 4 && 'Bon'}
                  {rating === 5 && 'Excellent'}
                </span>
              )}
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="comment">Votre commentaire (optionnel)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience..."
              rows="4"
              maxLength="500"
            />
            <span className="char-count">{comment.length}/500</span>
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || rating === 0}
            >
              {submitting ? 'Envoi en cours...' : 'Envoyer mon avis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
