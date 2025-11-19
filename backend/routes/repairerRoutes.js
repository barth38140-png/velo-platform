const express = require('express');
const router = express.Router();
const { 
  createRepaireProfile, 
  getRepairerProfile, 
  getAllRepairers, 
  updateAvailability 
} = require('../controllers/repairerProfileController');
const authenticateToken = require('../middlewares/auth');
const { validateCreateProfile } = require('../middlewares/validators');

// Route publique
router.get('/all', getAllRepairers);
router.get('/:userId', getRepairerProfile);

// Routes protégées (réparateur connecté)
router.post('/profile', authenticateToken, validateCreateProfile, createRepaireProfile);
router.patch('/availability', authenticateToken, updateAvailability);

module.exports = router;
