// backend/controllers/reviewController.js
const reviewModel = require('../models/reviewModel');
const logger = require('../src/logger');

/**
 * Créer un avis (POST /api/reviews)
 */
async function createReview(req, res) {
  const { repair_request_id, rating, comment } = req.body;
  const clientId = req.user.id;

  try {
    // Validation
    if (!repair_request_id || !rating) {
      return res.status(400).json({ error: 'repair_request_id et rating sont requis' });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ error: 'La note doit être un entier entre 1 et 5' });
    }

    // Vérifier que le client peut noter cette réparation
    const canReview = await reviewModel.canClientReview(repair_request_id, clientId);
    if (!canReview) {
      return res.status(403).json({ 
        error: 'Vous ne pouvez pas noter cette réparation (non terminée, pas propriétaire, ou déjà notée)' 
      });
    }

    // Récupérer l'ID du réparateur
    const { pool } = require('../config/db');
    const repairResult = await pool.query(
      'SELECT assigned_repairer_id FROM repair_requests WHERE id = $1',
      [repair_request_id]
    );

    if (!repairResult.rows[0]?.assigned_repairer_id) {
      return res.status(400).json({ error: 'Aucun réparateur assigné à cette réparation' });
    }

    const repairerId = repairResult.rows[0].assigned_repairer_id;

    // Créer l'avis
    const review = await reviewModel.createReview(
      repair_request_id,
      clientId,
      repairerId,
      rating,
      comment || null
    );

    logger.info('Review created', { reviewId: review.id, repairRequestId: repair_request_id, rating });

    res.status(201).json({ 
      message: 'Avis créé avec succès',
      review 
    });
  } catch (err) {
    logger.error('Error creating review', { error: err.message });
    
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Vous avez déjà noté cette réparation' });
    }
    
    res.status(500).json({ error: 'Erreur lors de la création de l\'avis' });
  }
}

/**
 * Récupérer l'avis d'une réparation (GET /api/reviews/repair/:repairId)
 */
async function getReviewByRepairId(req, res) {
  const { repairId } = req.params;

  try {
    const review = await reviewModel.getReviewByRepairId(repairId);
    
    if (!review) {
      return res.status(404).json({ error: 'Aucun avis trouvé pour cette réparation' });
    }

    res.json({ review });
  } catch (err) {
    logger.error('Error fetching review', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'avis' });
  }
}

/**
 * Récupérer tous les avis d'un réparateur (GET /api/reviews/repairer/:repairerId)
 */
async function getRepairerReviews(req, res) {
  const { repairerId } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await reviewModel.getReviewsByRepairerId(repairerId, limit, offset);
    res.json(result);
  } catch (err) {
    logger.error('Error fetching repairer reviews', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des avis' });
  }
}

/**
 * Récupérer les statistiques de notation d'un réparateur (GET /api/reviews/repairer/:repairerId/stats)
 */
async function getRepairerStats(req, res) {
  const { repairerId } = req.params;

  try {
    const stats = await reviewModel.getRepairerRatingStats(repairerId);
    res.json(stats);
  } catch (err) {
    logger.error('Error fetching repairer stats', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
}

module.exports = {
  createReview,
  getReviewByRepairId,
  getRepairerReviews,
  getRepairerStats
};
