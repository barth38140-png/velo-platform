const express = require('express');
const router = express.Router();
const { createRepair, getRepairs, getRepairDetail, updateRepairStatus, getPendingRepairs } = require('../controllers/repairController');
const authenticateToken = require('../middlewares/auth');
const { validateCreateRepair, validateUpdateRepairStatus } = require('../middlewares/validators');

// Routes pour les clients
router.post('/', authenticateToken, validateCreateRepair, createRepair);
router.get('/', authenticateToken, getRepairs);
router.get('/detail/:requestId', authenticateToken, getRepairDetail);
router.patch('/:requestId/status', authenticateToken, validateUpdateRepairStatus, updateRepairStatus);

// Routes pour les réparateurs
router.get('/pending-requests', authenticateToken, getPendingRepairs);

module.exports = router;

