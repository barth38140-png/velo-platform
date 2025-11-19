const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/listingsController");

router.post("/", ctrl.createListing);
router.get("/", ctrl.getListings);

module.exports = router;


