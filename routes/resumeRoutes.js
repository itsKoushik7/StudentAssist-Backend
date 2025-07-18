const express = require("express");
const router = express.Router();
const { generateResumePDF } = require("../controllers/resumeController");

router.post("/", generateResumePDF);

module.exports = router;
