const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

router.get("/me", verifyToken, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});
router.get("/about", verifyToken, userController.getUserProfile);

module.exports = router;
