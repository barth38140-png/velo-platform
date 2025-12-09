/**
 * Contrôleur d'authentification pour l'API
 * Fournit registerUser et loginUser
 * @module controllers/authController
 */
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../src/logger');

/**
 * Inscription d'un nouvel utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function registerUser(req, res) {
  try {
    const { email, password } = req.body;
    const existing = await userModel.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.createUser(email, hashedPassword);
    logger.info({ email }, "User registered");
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    logger.error({ err }, "registerUser error");
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

/**
 * Connexion utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "devsecret", { expiresIn: "24h" });
    logger.info({ email }, "User logged in");
    return res.status(200).json({ token });
  } catch (err) {
    logger.error({ err }, "loginUser error");
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports = { registerUser, loginUser };