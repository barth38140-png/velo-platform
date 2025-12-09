// Modèle Skill pour gestion des compétences partagées
// Utilise le pool PostgreSQL depuis config/db.js

const pool = require('../config/db');

/**
 * Ajoute une compétence si elle n'existe pas déjà (insensible à la casse)
 * @param {string} name
 * @returns {Promise<object>} La compétence insérée ou existante
 */
async function addSkillIfNotExists(name) {
  // Nettoyage du nom
  const cleanName = name.trim().toLowerCase();
  try {
    // Vérifie si la compétence existe déjà
    const { rows } = await pool.query(
      'SELECT * FROM skills WHERE LOWER(name) = $1',
      [cleanName]
    );
    if (rows.length > 0) return rows[0];
    // Ajoute la compétence
    const insert = await pool.query(
      'INSERT INTO skills (name) VALUES ($1) RETURNING *',
      [cleanName]
    );
    return insert.rows[0];
  } catch (err) {
    throw err;
  }
}

/**
 * Récupère toutes les compétences
 * @returns {Promise<Array>}
 */
async function getAllSkills() {
  try {
    const { rows } = await pool.query('SELECT * FROM skills ORDER BY name ASC');
    return rows;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  addSkillIfNotExists,
  getAllSkills
};
