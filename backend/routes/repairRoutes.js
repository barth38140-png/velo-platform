const express = require('express');
const router = express.Router();
const { createRepair, getRepairs, getRepairDetail, updateRepairStatus, getPendingRepairs, startRepair, completeRepair } = require('../controllers/repairController');
const { upload, uploadPhotosHandler, getPhotoHandler } = require('../controllers/repairPhotoController');
const authenticateToken = require('../middlewares/auth');
const { validateCreateRepair, validateUpdateRepairStatus } = require('../middlewares/validators');
const { requireRole } = require('../middlewares/roles');

// Routes pour les clients
// Only clients may create repair requests
router.post('/', authenticateToken, requireRole('client'), validateCreateRepair, createRepair);
// Upload photos for a repair request (multipart/form-data)
router.post('/:requestId/photos', authenticateToken, upload.array('photos', 6), uploadPhotosHandler);
// Serve photo file (authenticated)
router.get('/photos/:photoId', authenticateToken, getPhotoHandler);
router.get('/', authenticateToken, getRepairs);
router.get('/detail/:requestId', authenticateToken, getRepairDetail);
router.patch('/:requestId/status', authenticateToken, validateUpdateRepairStatus, updateRepairStatus);

// Transitions de statut spécifiques
router.post('/:requestId/start', authenticateToken, startRepair);
router.post('/:requestId/complete', authenticateToken, completeRepair);

// Routes pour les réparateurs
router.get('/pending-requests', authenticateToken, getPendingRepairs);

module.exports = router;

