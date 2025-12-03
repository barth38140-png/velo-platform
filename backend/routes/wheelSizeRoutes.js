const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getWheelSizes, addWheelSize, seedWheelSizes } = require('../src/controllers/wheelSizeController');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validators');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

const validateAddWheelSize = [
  body('size').trim().notEmpty().isLength({ min: 1, max: 20 }).withMessage('Wheel size required (1-20 chars)'),
  handleValidationErrors
];

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'too_many_requests', message: 'Too many admin requests, please slow down.' }
});

router.get('/', getWheelSizes);
router.post('/', validateAddWheelSize, addWheelSize);
router.post('/seed', adminLimiter, auth, isAdmin, seedWheelSizes);

module.exports = router;
