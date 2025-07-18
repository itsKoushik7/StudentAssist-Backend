const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const dayjs = require("dayjs");
const { sendOtpEmail, sendWelcomeEmail } = require("../services/emailService");
require("dotenv").config();

// Step 1: Register + Send OTP (Save in pending_users)
exports.registerUser = async (req, res) => {
  const { name, email, password, college_display_code, branch, year } =
    req.body;

  try {
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = dayjs().add(5, "minute").format("YYYY-MM-DD HH:mm:ss");

    // Get college ID
    const [collegeRows] = await pool.query(
      "SELECT id FROM colleges WHERE display_code = ?",
      [college_display_code]
    );

    if (!collegeRows.length) {
      return res.status(400).json({ error: "Invalid college code." });
    }

    const collegeId = collegeRows[0].id;

    // Insert or update pending user
    await pool.query(
      `REPLACE INTO pending_users (name, email, password_hash, otp_code, otp_expires_at, college_id, branch, year)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, otp, expiresAt, collegeId, branch, year]
    );

    await sendOtpEmail(email, otp);
    res.status(200).json({ message: "OTP sent to email. Please verify." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Step 2: Verify OTP & Create user
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const [pending] = await pool.query(
      "SELECT * FROM pending_users WHERE email = ? AND  otp_code = ?",
      [email, otp]
    );

    if (pending.length === 0)
      return res.status(400).json({ message: "Invalid OTP" });

    const record = pending[0];
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await pool.query(
      `INSERT INTO users (name, email, password_hash, college_id, branch, year)
   VALUES (?, ?, ?, ?, ?, ?)`,
      [
        record.name,
        record.email,
        record.password_hash,
        record.college_id,
        record.branch,
        record.year,
      ]
    );

    await pool.query("DELETE FROM pending_users WHERE email = ?", [email]);
    await sendWelcomeEmail(email, record.name);

    await pool.query("UPDATE colleges SET has_students = 1 WHERE id = ?", [
      record.college_id,
    ]);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Login attempt received for email:", email);

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (!rows.length) {
      console.warn("❌ User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.warn("⚠️ Invalid password for user:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log("✅ Login successful. Token generated for:", email);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Both fields are required." });
  }

  try {
    const [rows] = await pool.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(
      currentPassword,
      rows[0].password_hash
    );
    if (!isMatch)
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      hashed,
      userId,
    ]);

    res.status(200).json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getUserProfile = async (req, res) => {
  const userId = req.user.id; // decoded from JWT token

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        u.id, u.name, u.email, u.branch, u.year, u.created_at,
        c.college_name
      FROM users u
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE u.id = ?
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
