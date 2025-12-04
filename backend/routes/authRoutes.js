const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const logger = require('../src/logger');
const { userController } = require('../controllers');

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Route de création d'admin (dev only - à supprimer en production)
router.post('/create-admin', async (req, res) => {
  const { email = 'admin@demo.fr', password = 'admin123', name = 'Admin Demo' } = req.body;

  try {
    // Vérifier si l'admin existe déjà
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      const token = jwt.sign(
        { id: existing.rows[0].id, email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(200).json({
        success: true,
        message: 'Admin existe déjà',
        token,
        email,
        password
      });
    }

    // Créer l'admin
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (
        email, password_hash, name, phone, role
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, role`,
      [email, password_hash, name, null, 'admin']
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info({ email, role: 'admin' }, 'Admin user created');

    return res.status(201).json({
      success: true,
      message: 'Compte admin créé',
      token,
      email,
      password
    });
  } catch (err) {
    logger.error({ err }, 'Error creating admin user');
    return res.status(500).json({ error: 'Erreur lors de la création de l\'admin' });
  }
});

module.exports = router;

