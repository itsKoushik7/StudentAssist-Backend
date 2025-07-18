const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  verifyOtp,
  changePassword,
} = require("../controllers/user.controller");

const { verifyToken } = require("../middleware/authMiddleware");
router.post("/auth/verify", verifyOtp);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/change-password", verifyToken, changePassword);
router.get("/me", verifyToken, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});
router.get("/about", verifyToken, getUserProfile);

module.exports = router;
