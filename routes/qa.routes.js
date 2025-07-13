// const express = require("express");
// const router = express.Router();
// const { generateQAPdf } = require("../controllers/generateQA.controller");
// const { verifyToken } = require("../middleware/authMiddleware");

// router.get("/generate", verifyToken, generateQAPdf);

// module.exports = router;

const express = require("express");
const router = express.Router();
const { generateQAPdf } = require("../controllers/generateQA.controller");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/generate", verifyToken, generateQAPdf);

module.exports = router;
