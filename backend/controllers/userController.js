const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

/**
 * Inscription d'un nouvel utilisateur
 */
async function registerUser(req, res) {
  const { email, password, name, phone, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Vérifier si l'email existe déjà
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Hasher le mot de passe
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insérer l'utilisateur
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, phone, role, created_at',
      [email, password_hash, name || null, phone || null, role || 'client']
    );

    const user = result.rows[0];

    // Générer le JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('registerUser error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Connexion utilisateur
 */
async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Chercher l'utilisateur
    const result = await pool.query(
      'SELECT id, email, name, phone, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Générer le JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('loginUser error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Récupérer la liste des utilisateurs
 */
async function getUsers(req, res) {
  try {
    const r = await pool.query('SELECT id, email, name, phone, role, created_at FROM users ORDER BY id DESC LIMIT 50');
    res.json({ success: true, users: r.rows });
  } catch (e) {
    console.error('getUsers error:', e);
    res.status(500).json({ error: 'db_error' });
  }
}

/**
 * Récupérer le profil de l'utilisateur connecté
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, email, name, phone, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Si c'est un réparateur, chercher son profil
    if (user.role === 'repairer') {
      const repairerProfile = await pool.query(
        'SELECT * FROM repairer_profiles WHERE user_id = $1',
        [userId]
      );
      user.repairer_profile = repairerProfile.rows[0] || null;
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getProfile
};
