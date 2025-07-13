// routes/classify.js

const express = require("express");
const router = express.Router();
const { classifyUnit } = require("../unitClassifier");

router.post("/classify", (req, res) => {
  const { question } = req.body;

  if (!question) return res.status(400).json({ error: "Question is required" });

  const unit = classifyUnit(question);
  res.json({ unit });
});

module.exports = router;
