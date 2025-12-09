// Contrôleur Skill pour gestion des compétences partagées
// Utilise le modèle Skill
const skillModel = require('../models/skillModel');
const logger = require('../config/logger');

/**
 * GET /skills : retourne toutes les compétences
 */
async function getSkills(req, res) {
  try {
    const skills = await skillModel.getAllSkills();
    logger.info('Skills list sent');
    res.status(200).json({ success: true, skills });
  } catch (err) {
    logger.error('Error fetching skills:', err);
    res.status(500).json({ error: "Erreur lors de la récupération des compétences." });
  }
}

/**
 * POST /skills : ajoute une compétence si nouvelle
 */
async function addSkill(req, res) {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: "Nom de compétence invalide." });
  }
  try {
    const skill = await skillModel.addSkillIfNotExists(name);
    logger.info(`Skill added or found: ${skill.name}`);
    res.status(201).json({ success: true, skill });
  } catch (err) {
    logger.error('Error adding skill:', err);
    res.status(500).json({ error: "Erreur lors de l'ajout de la compétence." });
  }
}

module.exports = {
  getSkills,
  addSkill
};
