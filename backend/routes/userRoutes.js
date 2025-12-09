const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { registerUser, loginUser, getUsers, getProfile, elevateToAdmin, updateUserLocation } = require('../controllers/userController');
const authenticateToken = require('../middlewares/auth');
console.log('[DEBUG] authenticateToken type:', typeof authenticateToken);
// Mise à jour de la géolocalisation d'un utilisateur (réparateur)
router.put('/:id/location', authenticateToken, updateUserLocation);
const { validateRegister, validateLogin } = require('../middlewares/validators');

// Rate limiting for auth endpoints
// Middleware de rate limiting pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // 100 en dev, 10 en prod
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, veuillez réessayer plus tard.' },
});

router.post('/register', authLimiter, validateRegister, registerUser);
router.post('/login', authLimiter, validateLogin, loginUser);
router.get('/', getUsers);
router.get('/profile', authenticateToken, getProfile);
// Dev-only admin elevation (requires JWT + x-admin-secret header)
const { asyncHandler } = require('../middlewares/errorHandler');
router.put('/elevate-admin', authenticateToken, asyncHandler(elevateToAdmin));

module.exports = router;
