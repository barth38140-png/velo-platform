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

function start(port = PORT) {
  return new Promise((resolve, reject) => {
    if (server) return resolve(server);
    server = app.listen(port, () => resolve(server)).on('error', reject);
  });
}

function stop() {
  return new Promise((resolve, reject) => {
    if (!server) return resolve();
    server.close(err => (err ? reject(err) : resolve()));
    server = null;
  });
}

if (require.main === module) {
  start().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { start, stop, app };










