const db = require('../db');

async function createBooking(req, res) {
  try {
    if (req.body && typeof req.body === "object") {
      if (!req.body.start_date && req.body.scheduled_from) {
        const d = new Date(req.body.scheduled_from);
        if (!isNaN(d.getTime())) req.body.start_date = d.toISOString().slice(0,10);
      }
      if (!req.body.end_date && req.body.scheduled_to) {
        const d2 = new Date(req.body.scheduled_to);
        if (!isNaN(d2.getTime())) req.body.end_date = d2.toISOString().slice(0,10);
      }
    }
  } catch {
    // Error handled silently
  }

  try {
    const { listing_id, client_id, start_date, end_date, status = "pending" } = req.body || {};
    const missing = [];
    if (!listing_id) { missing.push("listing_id"); }
    if (!client_id)  { missing.push("client_id"); }
    if (!start_date) { missing.push("start_date"); }
    if (!end_date)   { missing.push("end_date"); }
    if (missing.length) {
      console.log("createBooking validation failed - missing:", missing);
      return res.status(400).json({ error: "missing_fields", required: missing, detail_reason_for_400: "missing_required_fields" });
    }

    const checkListing = await db.query("SELECT 1 FROM listings WHERE id = $1", [listing_id]);
    if (checkListing.rowCount === 0) {
      console.log("createBooking invalid listing_id:", listing_id);
      return res.status(400).json({ error: "invalid_listing_id", detail_reason_for_400: "listing_not_found" });
    }
    const checkUser = await db.query("SELECT 1 FROM users WHERE id = $1", [client_id]);
    if (checkUser.rowCount === 0) {
      console.log("createBooking invalid client_id:", client_id);
      return res.status(400).json({ error: "invalid_client_id", detail_reason_for_400: "client_not_found" });
    }

    const q = `INSERT INTO bookings (listing_id, client_id, start_date, end_date, status)
               VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const params = [listing_id, client_id, start_date, end_date, status];
    console.log("SQL:", q);
    console.log("PARAMS:", params);

    const { rows } = await db.query(q, params);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createBooking ERROR:", err && err.stack ? err.stack : err);
    if (err && err.code === "23503") return res.status(400).json({ error: "foreign_key_violation", detail: err.detail, detail_reason_for_400: "fk_violation" });
    return res.status(500).json({ error: "internal_error" });
  }
}
async function getBookings(req, res) {
  try {
    const { client_id, repairer_id } = req.query;
    const conditions = [];
    const params = [];
    if (repairer_id) { params.push(repairer_id); conditions.push(`repairer_id = $${params.length}`); }
    if (client_id)  { params.push(client_id);  conditions.push(`client_id = $${params.length}`); }
    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
    const q = `SELECT * FROM bookings ${where} ORDER BY scheduled_from DESC LIMIT 200`;
    console.log('SQL:', q);
    console.log('PARAMS:', params);
    const { rows } = await db.query(q, params);
    return res.json(rows);
  } catch (err) {
    console.error('getBookings ERROR:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

module.exports = { createBooking, getBookings };


