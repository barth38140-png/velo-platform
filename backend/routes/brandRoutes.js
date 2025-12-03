const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getBrands, addBrand, seedBrands, normalizeBrands } = require('../src/controllers/brandController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const { validateAddBrand } = require('../middlewares/validators');

// Rate limit admin operations
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { error: 'too_many_requests', message: 'Too many admin requests, please slow down.' }
});

router.get('/', getBrands);
router.post('/', validateAddBrand, addBrand);
router.post('/seed', adminLimiter, auth, isAdmin, seedBrands);
router.post('/normalize', adminLimiter, auth, isAdmin, normalizeBrands);

module.exports = router;
