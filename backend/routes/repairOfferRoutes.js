const express = require('express');
const router = express.Router();
const {
  createOffer,
  getOffersForRepair,
  getMyOffers,
  getClientOffers,
  getOfferDetail,
  updateOfferStatus,
  proposeDate,
  confirmDate
} = require('../controllers/repairOfferController');
const authenticateToken = require('../middlewares/auth');
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validators');

// Validators for repair offers
const validateCreateOffer = [
  body('repair_request_id').isInt({ min: 1 }).withMessage('Invalid repair request ID'),
  body('offered_price').isFloat({ min: 0.01 }).withMessage('Price must be at least 0.01'),
  body('estimated_duration_hours').isInt({ min: 1 }).withMessage('Duration must be at least 1 hour'),
  body('message').isString().isLength({ min: 5, max: 1000 }).withMessage('Message must be 5-1000 characters'),
  handleValidationErrors
];

const validateUpdateOfferStatus = [
  param('offerId').isInt({ min: 1 }).withMessage('Invalid offer ID'),
  body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected'),
  handleValidationErrors
];

const validateProposeDate = [
  param('offerId').isInt({ min: 1 }).withMessage('Invalid offer ID'),
  body('scheduled_from').isISO8601().withMessage('scheduled_from must be a valid date'),
  body('scheduled_to').optional({ nullable: true }).isISO8601().withMessage('scheduled_to must be a valid date'),
  handleValidationErrors
];

const validateConfirmDate = [
  param('offerId').isInt({ min: 1 }).withMessage('Invalid offer ID'),
  handleValidationErrors
];

// Routes
router.post('/', authenticateToken, validateCreateOffer, createOffer);
router.get('/my-offers', authenticateToken, getMyOffers);
router.get('/client-offers', authenticateToken, getClientOffers);
router.get('/:repairId/offers', authenticateToken, getOffersForRepair);
router.get('/:offerId', authenticateToken, getOfferDetail);
router.patch('/:offerId/status', authenticateToken, validateUpdateOfferStatus, updateOfferStatus);

// Date negotiation routes
router.post('/:offerId/propose-date', authenticateToken, validateProposeDate, proposeDate);
router.post('/:offerId/confirm-date', authenticateToken, validateConfirmDate, confirmDate);

module.exports = router;
