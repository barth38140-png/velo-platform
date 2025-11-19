const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/userModel');

async function registerUser(req, res) {
  const { email, password } = req.body;
  try {
    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ error: 'Email dÃ©jÃ  utilisÃ©' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser(email, hashed);
    res.status(201).json({ id: user.id, email: user.email });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { registerUser, loginUser };

