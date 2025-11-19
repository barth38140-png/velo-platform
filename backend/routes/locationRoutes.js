const express = require('express');
const router = express.Router();
const { updateLocation, getLocation, getNearbyRepairers } = require('../controllers/locationController');
const authenticateToken = require('../middlewares/auth');
const { validateUpdateLocation, validateNearbySearch } = require('../middlewares/validators');

router.post('/', authenticateToken, validateUpdateLocation, updateLocation);
router.get('/:userId', authenticateToken, getLocation);
router.get('/nearby-repairers', validateNearbySearch, getNearbyRepairers);

module.exports = router;

