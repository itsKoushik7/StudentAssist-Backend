const express = require("express");
const router = express.Router();
const paperController = require("../controllers/paper.controller");
const { verifyToken } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/temp"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

router.post(
  "/upload",
  verifyToken,
  upload.single("paper"),
  paperController.uploadPaper
);

module.exports = router;
