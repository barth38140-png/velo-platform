// backend/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middlewares/auth');

// Créer un avis (client uniquement)
router.post('/', authenticate, reviewController.createReview);

// Récupérer l'avis d'une réparation
router.get('/repair/:repairId', reviewController.getReviewByRepairId);

// Récupérer tous les avis d'un réparateur
router.get('/repairer/:repairerId', reviewController.getRepairerReviews);

// Récupérer les statistiques d'un réparateur
router.get('/repairer/:repairerId/stats', reviewController.getRepairerStats);

module.exports = router;
