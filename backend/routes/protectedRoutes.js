const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

// GET /api/protected-route/ -> retourne l'utilisateur présent dans le token
router.get("/", auth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = router;
