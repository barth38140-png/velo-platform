const pool = require('../db/db');

async function findUserByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return res.rows[0];
}

async function createUser(email, hashedPassword) {
  const res = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
    [email, hashedPassword]
  );
  return res.rows[0];
}

module.exports = { findUserByEmail, createUser };
