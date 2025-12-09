// Routes Express pour la gestion des compétences partagées
const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const { auth } = require('../middlewares/auth');

// GET /skills : liste toutes les compétences
router.get('/', auth, skillController.getSkills);

// POST /skills : ajoute une compétence (authentifié)
router.post('/', auth, skillController.addSkill);

module.exports = router;
