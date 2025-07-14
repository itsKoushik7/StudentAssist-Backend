const pool = require("../config/db");

exports.getSubjects = async (req, res) => {
  const { search = "", limit = 10 } = req.query;

  try {
    const [subjects] = await pool.query(
      `SELECT id, subject_code, subject_name
       FROM subjects
       WHERE subject_name LIKE ? OR subject_code LIKE ?
       ORDER BY subject_name ASC
       LIMIT ?`,
      [`%${search}%`, `%${search}%`, parseInt(limit)]
    );

    res.json({ subjects });
  } catch (err) {
    console.error("❌ Failed to fetch subjects:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
