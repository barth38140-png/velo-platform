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
      if (existingUser.rows.length > 0) { // Suppression de la variable non utilisée 'err'
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
  } catch {
    logger.warn({ email }, 'loginUser catch');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupérer la liste des utilisateurs
 */
async function getUsers(req, res) {
  try {
    const r = await pool.query('SELECT id, email, name, phone, role, created_at, location_lat, location_lng FROM users ORDER BY id DESC LIMIT 50');
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

async function elevateToAdmin(req, res, next) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const err = new Error('Accès interdit');
      err.statusCode = 403;
      return next(err);
    }
    const secret = req.headers['x-admin-secret'];
    const expected = process.env.ADMIN_ELEVATE_SECRET || 'dev-elevate';
    if (!secret || secret !== expected) {
      const err = new Error('Accès interdit');
      err.statusCode = 403;
      return next(err);
    }
    const userId = req.user && req.user.id;
    if (!userId) {
      const err = new Error('Non authentifié');
      err.statusCode = 401;
      return next(err);
    }
    const r = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, phone, role', ['admin', userId]);
    if (r.rows.length === 0) {
      const err = new Error('Utilisateur introuvable');
      err.statusCode = 404;
      return next(err);
    }
    const user = r.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    // Audit log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await logAdminAction(userId, 'elevate_admin', { email: user.email }, ipAddress);
    res.json({ success: true, token, user });
  } catch (e) {
    logger.error({ err: e, userId: req.user?.id }, 'elevateToAdmin error');
    e.statusCode = 500;
    return next(e);
  }
}

/**
 * Admin: Récupérer tous les utilisateurs avec filtres
 */
async function getAllUsersAdmin(req, res) {
  try {
    const { status = 'all', role = 'all', search = '', limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT id, email, name, phone, role, status, created_at, last_login, location_lat, location_lng FROM users WHERE 1=1';
    const params = [];
    
    if (status !== 'all') {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }
    
    if (role !== 'all') {
      query += ' AND role = $' + (params.length + 1);
      params.push(role);
    }
    
    if (search) {
      query += ' AND (email ILIKE $' + (params.length + 1) + ' OR name ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }
    
    const countRes = await pool.query(
      query.replace('SELECT id, email, name, phone, role, status, created_at, last_login FROM users', 'SELECT COUNT(*) as total FROM users'),
      params
    );
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const res_data = await pool.query(query, params);
    return res.json({
      success: true,
      users: res_data.rows,
      total: parseInt(countRes.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    logger.error({ err }, 'getAllUsersAdmin error');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Admin: Suspendre/activer un utilisateur
 */
async function toggleUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body; // status: 'active', 'suspended', 'banned'
    
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    
    const result = await pool.query(
      'UPDATE users SET status = $1, status_reason = $2, status_updated_at = NOW() WHERE id = $3 RETURNING id, email, status',
      [status, reason || null, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Log audit
    await logAdminAction(req.user.id, 'USER_STATUS_CHANGE', `User ${userId} status changed to ${status}`, { userId, status, reason });
    
    return res.json({
      success: true,
      user: result.rows[0],
      message: `Utilisateur ${status === 'active' ? 'activé' : status === 'suspended' ? 'suspendu' : 'banni'}`
    });
  } catch (err) {
    logger.error({ err }, 'toggleUserStatus error');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Admin: Vérifier/valider un utilisateur réparateur
 */
async function verifyRepairerProfile(req, res) {
  try {
    const { userId } = req.params;
    const { verified, verificationNotes } = req.body;
        const result = await pool.query(
          'UPDATE users SET verified = $1, verification_notes = $2, verified_at = NOW(), verified_by = $3 WHERE id = $4 AND role = $5 RETURNING id, email, verified',
          [verified, verificationNotes || null, req.user.id, userId, 'repairer']
        );
    
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Utilisateur réparateur non trouvé' });
        }
    
        // Log d'audit
        await logAdminAction(req.user.id, 'REPAIRER_PROFILE_VERIFIED', `Repairer ${userId} verified: ${verified}`, { userId, verified, verificationNotes });
    
        return res.json({
          success: true,
          user: result.rows[0],
          message: verified
            ? 'Profil réparateur vérifié avec succès'
            : 'Profil réparateur marqué comme non vérifié'
        });
      } catch (err) {
        logger.error({ err }, 'verifyRepairerProfile error');
        return res.status(500).json({ error: 'Erreur serveur' });
      }
    }
    
    /**
 * Met à jour la géolocalisation d'un utilisateur (réparateur)
 * @route PUT /users/:id/location
 */
async function updateUserLocation(req, res) {
  const userId = parseInt(req.params.id, 10);
  const { lat, lng } = req.body;
  if (!userId || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Paramètres invalides' });
  }
  try {
    await require('../models/userModel').updateUserLocation(userId, lat, lng);
    logger.info({ userId, lat, lng }, 'updateUserLocation');
    res.json({ success: true });
  } catch (err) {
    logger.error({ err, userId }, 'updateUserLocation error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Admin: Récupérer les utilisateurs en attente de vérification
 */
async function getPendingVerifications(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, verified, verification_notes FROM users WHERE role = $1 AND verified = false',
      ['repairer']
    );
    res.json({ success: true, pending: result.rows });
  } catch (err) {
    logger.error({ err }, 'getPendingVerifications error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Export des fonctions du contrôleur
module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getProfile,
  elevateToAdmin,
  getAllUsersAdmin,
  toggleUserStatus,
  verifyRepairerProfile,
  updateUserLocation,
  getPendingVerifications,
};

