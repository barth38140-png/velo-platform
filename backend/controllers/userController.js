const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const logger = require('../src/logger');
const { logAdminAction } = require('../src/audit');

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

/**
 * Inscription d'un nouvel utilisateur
 */
async function registerUser(req, res) {
  const { email, password, name, phone, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    // Vérifier si l'email existe déjà
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
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

    return res.status(201).json({
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
    logger.error({ err, email }, 'registerUser error');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Connexion utilisateur
 */
async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    // Chercher l'utilisateur
    const result = await pool.query(
      'SELECT id, email, name, phone, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Générer le JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
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
    logger.warn({ email }, 'loginUser catch');
    return res.status(500).json({ error: 'Erreur serveur' });
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
    logger.error({ err: e }, 'getUsers error');
    res.status(500).json({ error: 'Erreur serveur' });
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
      return res.status(404).json({ error: 'Utilisateur introuvable' });
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
    const userId = req.user && req.user.id;
    logger.error({ err, userId }, 'Erreur lors de la récupération du profil');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function elevateToAdmin(req, res) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Accès interdit' });
    }
    const secret = req.headers['x-admin-secret'];
    const expected = process.env.ADMIN_ELEVATE_SECRET || 'dev-elevate';
    if (!secret || secret !== expected) {
      return res.status(403).json({ error: 'Accès interdit' });
    }
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Non authentifié' });
    const r = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, phone, role', ['admin', userId]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const user = r.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    // Audit log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAdminAction(userId, 'elevate_admin', { email: user.email }, ipAddress);
    res.json({ success: true, token, user });
  } catch (e) {
    logger.error({ err: e, userId: req.user?.id }, 'elevateToAdmin error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getProfile,
  elevateToAdmin
};
