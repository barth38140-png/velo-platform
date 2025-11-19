const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/bookingsController");

router.post("/", ctrl.createBooking);
router.get("/", ctrl.getBookings);

module.exports = router;



