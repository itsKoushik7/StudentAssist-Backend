// const pool = require("../config/db");

// exports.getColleges = async (req, res) => {
//   const { search = "", limit = 10 } = req.query;

//   try {
//     const [colleges] = await pool.query(
//       `SELECT id, college_name, place
//        FROM colleges
//        WHERE college_name LIKE ? OR place LIKE ?
//        ORDER BY college_name ASC
//        LIMIT ?`,
//       [`%${search}%`, `%${search}%`, parseInt(limit)]
//     );

//     res.json({ colleges });
//   } catch (err) {
//     console.error("❌ Failed to fetch colleges:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const pool = require("../config/db");

exports.getColleges = async (req, res) => {
  const { search = "", limit = 10 } = req.query;

  try {
    const [colleges] = await pool.query(
      `SELECT id, college_name, display_code, place 
       FROM colleges 
       WHERE college_name LIKE ? OR place LIKE ?
       ORDER BY college_name ASC
       LIMIT ?`,
      [`%${search}%`, `%${search}%`, parseInt(limit)]
    );

    res.json({ colleges });
  } catch (err) {
    console.error("❌ Failed to fetch colleges:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
