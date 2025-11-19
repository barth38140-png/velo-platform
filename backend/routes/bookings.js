const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

/*
 Protected bookings router (placeholder)
 - GET /bookings        : list bookings for current user (placeholder)
 - POST /bookings       : create a booking (minimal validation)
 - GET /bookings/:id    : get a booking by id (placeholder)
 Replace placeholders with real model/controller calls when ready.
*/

// simple validator: require at least one property in body
function validateBookingBody(req, res, next) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Invalid booking payload' });
  }
  next();
}

router.get('/', auth, async (req, res) => {
  // placeholder: should call booking model with req.user.userId
  res.json({ bookings: [], note: 'bookings list placeholder' });
});

router.post('/', auth, validateBookingBody, async (req, res) => {
  const payload = req.body;
  // placeholder: replace with real model call that returns created booking
  res.status(201).json({ id: null, ...payload, note: 'booking created (placeholder)' });
});

router.get('/:id', auth, async (req, res) => {
  const id = req.params.id;
  // placeholder: should verify ownership and return booking from DB
  res.json({ id, note: 'single booking placeholder' });
});

module.exports = router;
