const express = require("express");
const router = express.Router();
const { getSubjects } = require("../controllers/subject.controller");

router.get("/", getSubjects); // GET /api/subjects

module.exports = router;
