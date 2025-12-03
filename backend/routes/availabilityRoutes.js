const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const availabilityController = require('../controllers/availabilityController');

// Public listing of a repairer's slots (clients browse)
router.get('/:repairerId', auth, availabilityController.list);

// Repairer manages own slots
router.post('/', auth, availabilityController.create);
router.delete('/:slotId', auth, availabilityController.remove);

// Client reserves a slot
router.post('/:slotId/reserve', auth, availabilityController.reserve);

module.exports = router;
