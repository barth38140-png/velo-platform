const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { registerUser, loginUser, getUsers, getProfile, elevateToAdmin } = require('../controllers/userController');
const authenticateToken = require('../middlewares/auth');
const { validateRegister, validateLogin } = require('../middlewares/validators');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: { error: 'too_many_requests', message: 'Too many auth attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', authLimiter, validateRegister, registerUser);
router.post('/login', authLimiter, validateLogin, loginUser);
router.get('/', getUsers);
router.get('/profile', authenticateToken, getProfile);
// Dev-only admin elevation (requires JWT + x-admin-secret header)
router.post('/elevate-admin', authenticateToken, elevateToAdmin);

module.exports = router;
