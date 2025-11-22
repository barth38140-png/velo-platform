require('dotenv').config();
/* src/index.js */
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

/* AJOUT: body parser global */
app.use(express.json());

const userRoutes = require('../routes/userRoutes');
app.use('/api/users', userRoutes);

/* AJOUT: monter le router d'auth */
const authRoutes = require('../routes/authRoutes');
app.use('/api/auth', authRoutes);
const bookingsRouter = require('../routes/bookings');
app.use('/bookings', bookingsRouter);


app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
let server = null;
const db = require('./db');
let configDbPool = null;
try {
  // some controllers/routes use the legacy config pool (backend/config/db.js)
  configDbPool = require('../config/db');
} catch {
  // ignore if not present in this environment
  configDbPool = null;
}

function start(port = PORT) {
  return new Promise((resolve, reject) => {
    if (server) return resolve(server);
    server = app.listen(port, () => resolve(server)).on('error', reject);
  });
}

function stop() {
  return new Promise((resolve, reject) => {
    if (!server) return resolve();
    server.close(async err => {
      if (err) return reject(err);
      server = null;
      try {
        if (db && db.pool && typeof db.pool.end === 'function') {
          await db.pool.end();
        }
        if (configDbPool && typeof configDbPool.end === 'function') {
          await configDbPool.end();
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

if (require.main === module) {
  start().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { start, stop, app };










