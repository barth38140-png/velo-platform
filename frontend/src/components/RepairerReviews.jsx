import React, { useState, useEffect } from 'react';
import '../styles/RepairerReviews.css';

/**
 * Composant pour afficher les avis d'un réparateur
 * @param {number} repairerId - ID du réparateur
 */
export default function RepairerReviews({ repairerId }) {
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 5;

  useEffect(() => {
    loadStatsAndReviews();
  }, [repairerId]);

  const loadStatsAndReviews = async () => {
    setLoading(true);
    try {
      // Charger les statistiques
      const statsRes = await fetch(`/api/reviews/repairer/${repairerId}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Charger les avis
      const reviewsRes = await fetch(`/api/reviews/repairer/${repairerId}?limit=${limit}&offset=0`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews);
        setHasMore(reviewsData.reviews.length === limit);
        setPage(0);
      }
    } catch (err) {
      // Utiliser le logger Pino côté backend pour les erreurs de chargement des avis
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/reviews/repairer/${repairerId}?limit=${limit}&offset=${nextPage * limit}`);
      if (res.ok) {
        const data = await res.json();
        setReviews([...reviews, ...data.reviews]);
        setHasMore(data.reviews.length === limit);
        setPage(nextPage);
      }
    } catch (err) {
      // Utiliser le logger Pino côté backend pour les erreurs de chargement des avis supplémentaires
    }
  };

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  const renderDistribution = () => {
    if (!stats || stats.reviewCount === 0) return null;

    return (
      <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.distribution[star] || 0;
          const percentage = stats.reviewCount > 0 ? (count / stats.reviewCount) * 100 : 0;
          
          return (
            <div key={star} className="distribution-row">
              <span className="star-label">{star} ★</span>
              <div className="bar-container">
                <div className="bar" style={{ width: `${percentage}%` }} />
              </div>
              <span className="count">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="reviews-loading">Chargement des avis...</div>;
  }

  if (!stats || stats.reviewCount === 0) {
    return (
      <div className="reviews-container">
        <h3>Avis clients</h3>
        <p className="no-reviews">Aucun avis pour le moment</p>
      </div>
    );
  }

  return (
    <div className="reviews-container">
      <h3>Avis clients</h3>

      <div className="stats-summary">
        <div className="average-rating">
          <span className="rating-number">{stats.averageRating}</span>
          <div className="stars">{renderStars(Math.round(parseFloat(stats.averageRating)))}</div>
          <span className="review-count">
            {stats.reviewCount} avis
          </span>
        </div>

        {renderDistribution()}
      </div>

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              <div>
                <span className="client-name">{review.client_name}</span>
                <div className="stars">{renderStars(review.rating)}</div>
              </div>
              <span className="review-date">
                {new Date(review.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>

            {review.repair_title && (
              <p className="repair-context">Réparation : {review.repair_title}</p>
            )}

            {review.comment && (
              <p className="review-comment">{review.comment}</p>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <button className="load-more-btn" onClick={loadMore}>
          Voir plus d'avis
        </button>
      )}
    </div>
  );
}
