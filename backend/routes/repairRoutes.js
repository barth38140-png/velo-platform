const express = require('express');
const router = express.Router();
const { createRepair, getRepairs, getRepairDetail, updateRepairStatus, getPendingRepairs } = require('../controllers/repairController');
const { upload, uploadPhotosHandler, getPhotoHandler } = require('../controllers/repairPhotoController');
const authenticateToken = require('../middlewares/auth');
const { validateCreateRepair, validateUpdateRepairStatus } = require('../middlewares/validators');

// Routes pour les clients
router.post('/', authenticateToken, validateCreateRepair, createRepair);
// Upload photos for a repair request (multipart/form-data)
router.post('/:requestId/photos', authenticateToken, upload.array('photos', 6), uploadPhotosHandler);
// Serve photo file (authenticated)
router.get('/photos/:photoId', authenticateToken, getPhotoHandler);
router.get('/', authenticateToken, getRepairs);
router.get('/detail/:requestId', authenticateToken, getRepairDetail);
router.patch('/:requestId/status', authenticateToken, validateUpdateRepairStatus, updateRepairStatus);

// Routes pour les réparateurs
router.get('/pending-requests', authenticateToken, getPendingRepairs);

module.exports = router;

