const express = require("express");
const router = express.Router();
const { getColleges } = require("../controllers/collegeController");

router.get("/colleges", getColleges);

module.exports = router;
