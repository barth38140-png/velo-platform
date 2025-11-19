const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/reviewsController");

router.post("/", ctrl.createReview);
router.get("/", ctrl.getReviews);

module.exports = router;


