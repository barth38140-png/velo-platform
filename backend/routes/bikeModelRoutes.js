const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getModels, addModel, seedBikeModels } = require('../src/controllers/bikeModelController');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validators');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

const validateAddModel = [
  body('brand').trim().notEmpty().isLength({ min: 1, max: 50 }).withMessage('Brand required (1-50 chars)'),
  body('model').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Model required (1-100 chars)'),
  handleValidationErrors
];

// Rate limit admin seeding operations
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'too_many_requests', message: 'Too many admin requests, please slow down.' }
});

router.get('/', getModels);
router.post('/', validateAddModel, addModel);
router.post('/seed', adminLimiter, auth, isAdmin, seedBikeModels);

module.exports = router;
