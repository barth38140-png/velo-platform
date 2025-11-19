const db = require("../db");

async function createReview(req, res) {
  try {
    const { booking_id, repairer_id, client_id, rating, comment } = req.body;
    if (!booking_id || !repairer_id || !client_id || !rating) return res.status(400).json({ error: "missing_fields" });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: "rating_range" });

    const q = `INSERT INTO reviews (booking_id, repairer_id, client_id, rating, comment)
               VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const { rows } = await db.query(q, [booking_id, repairer_id, client_id, rating, comment]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23503") return res.status(400).json({ error: "foreign_key_violation" });
    return res.status(500).json({ error: "internal_error" });
  }
}

async function getReviews(req, res) {
  try {
    const { repairer_id } = req.query;
    const params = [];
    const where = repairer_id ? `WHERE repairer_id = $1` : "";
    if (repairer_id) params.push(repairer_id);
    const q = `SELECT * FROM reviews ${where} ORDER BY created_at DESC LIMIT 200`;
    const { rows } = await db.query(q, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal_error" });
  }
}

module.exports = { createReview, getReviews };


