const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// exports.registerUser = async (req, res) => {
//   const { name, email, password, college_name, branch, year } = req.body;

//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const [collegeRows] = await pool.query(
//       "SELECT id FROM colleges WHERE college_name = ?",
//       [college_name]
//     );

//     let collegeId = collegeRows.length
//       ? collegeRows[0].id
//       : (
//           await pool.query("INSERT INTO colleges (college_name) VALUES (?)", [
//             college_name,
//           ])
//         )[0].insertId;

//     await pool.query(
//       "INSERT INTO users (name, email, password_hash, college_id, branch, year) VALUES (?, ?, ?, ?, ?, ?)",
//       [name, email, hashedPassword, collegeId, branch, year]
//     );

//     res.status(201).json({ message: "User registered successfully" });
//   } catch (err) {
//     console.error("Register error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

exports.registerUser = async (req, res) => {
  const { name, email, password, college_display_code, branch, year } =
    req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 1: Get college ID using display_code
    const [collegeRows] = await pool.query(
      "SELECT id FROM colleges WHERE display_code = ?",
      [college_display_code]
    );

    if (!collegeRows.length) {
      return res.status(400).json({ error: "Invalid college code." });
    }

    const collegeId = collegeRows[0].id;

    // Step 2: Insert new user
    await pool.query(
      `INSERT INTO users (name, email, password_hash, college_id, branch, year)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, collegeId, branch, year]
    );

    // Step 3: Update has_students = 1 for that college
    await pool.query("UPDATE colleges SET has_students = 1 WHERE id = ?", [
      collegeId,
    ]);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// exports.loginUser = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
//       email,
//     ]);

//     if (!rows.length)
//       return res.status(404).json({ message: "User not found" });

//     const user = rows[0];
//     const isMatch = await bcrypt.compare(password, user.password_hash);
//     if (!isMatch)
//       return res.status(401).json({ message: "Invalid credentials" });

//     const token = jwt.sign(
//       { id: user.id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRES_IN }
//     );

//     res.json({
//       token,
//       user: { id: user.id, name: user.name, email: user.email },
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Login attempt received for email:", email);

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    console.log("🧑 User lookup result:", rows);

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
