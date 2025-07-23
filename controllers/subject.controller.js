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

exports.getAvailSubjects = async (req, res) => {
  const { search = "", limit = 10 } = req.query;

  try {
    const [subjects] = await pool.query(
      `SELECT s.id, s.subject_code, s.subject_name
       FROM (
         SELECT DISTINCT subject_code
         FROM questions
         WHERE subject_code IS NOT NULL AND subject_code != ''
       ) q
       JOIN subjects s ON q.subject_code = s.subject_code
       WHERE s.subject_name LIKE ? OR s.subject_code LIKE ?
       ORDER BY s.subject_name ASC
       LIMIT ?`,
      [`%${search}%`, `%${search}%`, parseInt(limit)]
    );

    res.json({ subjects });
  } catch (err) {
    console.error("❌ Failed to fetch available subjects:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
