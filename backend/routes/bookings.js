const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const ctrl = require("../src/controllers/bookingsController");


// Auth required for all bookings routes
router.post("/", auth, ctrl.createBooking);
router.get("/", auth, ctrl.getBookings);
// Ajoute GET /bookings/:id pour test idempotence
router.get("/:id", auth, async (req, res) => {
	const id = req.params.id;
	try {
		const { rows } = await require("../src/db").query("SELECT * FROM bookings WHERE id = $1", [id]);
		if (rows.length === 0) return res.status(404).json({ error: "not_found" });
		return res.json(rows[0]);
	} catch {
		return res.status(500).json({ error: "internal_error" });
	}
});

module.exports = router;
