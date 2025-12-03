const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth');
const { createBikeHandler, getMyBikes, getBikeDetail, patchComponentWear, createComponentHandler, deleteComponentHandler, deleteBikeHandler, updateBikeHandler, updateBikeTechHandler } = require('../controllers/bikeController');

router.post('/', authenticateToken, createBikeHandler);
router.get('/', authenticateToken, getMyBikes);
router.get('/:bikeId', authenticateToken, getBikeDetail);
router.patch('/:bikeId', authenticateToken, updateBikeHandler);
router.patch('/:bikeId/tech', authenticateToken, updateBikeTechHandler);
router.post('/:bikeId/components', authenticateToken, createComponentHandler);
router.delete('/:bikeId', authenticateToken, deleteBikeHandler);
router.patch('/component/:componentId', authenticateToken, patchComponentWear);
router.delete('/component/:componentId', authenticateToken, deleteComponentHandler);

module.exports = router;
