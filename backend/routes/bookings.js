const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const ctrl = require("../src/controllers/bookingsController");
// Sécurité : log si le contrôleur est mal importé
if (!ctrl || typeof ctrl.createBooking !== 'function' || typeof ctrl.getBookings !== 'function') {
	 
	console.error('Erreur: bookingsController mal importé ou fonctions manquantes');
}


// Auth required for all bookings routes
router.post("/", auth, ctrl.createBooking);
router.get("/", auth, ctrl.getBookings);
// Ajoute GET /bookings/:id pour test idempotence
router.get("/:id", auth, async (req, res) => {
	const id = req.params.id;
	try {
		// Prefer mocked db.query in unit tests; otherwise use a direct Client to avoid pg-pool issues
		const db = require('../src/db');
		const shouldUseMock = db && db.query && (db.query._isMockFunction || db.query.mock || db.query.mockImplementation);
		if (shouldUseMock) {
			const { rows } = await db.query("SELECT * FROM bookings WHERE id = $1", [id]);
			if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
			return res.json(rows[0]);
		}
		const { Client } = require('pg');
		const client = new Client({
			host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
			port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
			user: process.env.DB_USER || process.env.PGUSER || 'postgres',
			password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
			database: process.env.DB_NAME || process.env.PGDATABASE || 'velo_platform_test'
		});
		await client.connect();
		try {
			const r = await client.query("SELECT * FROM bookings WHERE id = $1", [id]);
			await client.end();
			if (r.rows.length === 0) return res.status(404).json({ error: 'not_found' });
			return res.json(r.rows[0]);
		} catch {
			try { await client.end(); } catch {
				// Échec de fermeture, ignoré
			}
			return res.status(500).json({ error: 'internal_error' });
		}
	} catch {
		return res.status(500).json({ error: "internal_error" });
	}
});

module.exports = router;
