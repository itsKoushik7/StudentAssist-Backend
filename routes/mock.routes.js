const express = require("express");
const router = express.Router();
const {
  generateMock,
  submitMock,
  getMockFilters,
} = require("../controllers/mock.controller");

router.post("/questions", generateMock); // Generate questions
router.post("/submit", submitMock); // Submit answers, evaluate & download PDF
router.get("/filters", getMockFilters);

module.exports = router;
