const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

exports.registerUser = async (req, res) => {
  const { name, email, password, college_name, branch, year } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [collegeRows] = await pool.query(
      "SELECT id FROM colleges WHERE college_name = ?",
      [college_name]
    );

    let collegeId = collegeRows.length
      ? collegeRows[0].id
      : (
          await pool.query("INSERT INTO colleges (college_name) VALUES (?)", [
            college_name,
          ])
        )[0].insertId;

    await pool.query(
      "INSERT INTO users (name, email, password_hash, college_id, branch, year) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, collegeId, branch, year]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (!rows.length)
      return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
