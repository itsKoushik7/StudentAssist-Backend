const express = require("express");
const router = express.Router();
const {
  getSubjects,
  getAvailSubjects,
} = require("../controllers/subject.controller");

router.get("/", getSubjects); // GET /api/subjects
router.get("/available", getAvailSubjects);

module.exports = router;
