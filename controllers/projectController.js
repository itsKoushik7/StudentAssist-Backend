// const pool = require("../config/db");

// exports.submitProjectRequest = async (req, res) => {
//   console.log("📩 submitProjectRequest called");
//   const { title, description, tech_stack, subject_code, additional_info } =
//     req.body;
//   const student_id = req.user.id;

//   try {
//     await pool.query(
//       `INSERT INTO  project_requests (student_id, title, description, tech_stack, subject_code, additional_info)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [
//         student_id,
//         title,
//         description,
//         tech_stack,
//         subject_code,
//         additional_info,
//       ]
//     );
//     res
//       .status(201)
//       .json({ message: "Project request submitted successfully." });
//   } catch (err) {
//     console.error("❌ Error submitting project:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.getAllProjects = async (req, res) => {
//   console.log("🧠 getAllProjects called");
//   try {
//     const [projects] = await pool.query(`
//       SELECT p.*, u.name AS student_name
//       FROM  project_requests p
//       JOIN users u ON p.student_id = u.id
//       ORDER BY p.created_at DESC
//     `);
//     res.json({ projects });
//   } catch (err) {
//     console.error("❌ Error fetching projects:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.getProjectById = async (req, res) => {
//   console.log("🔍 getProjectById called");
//   const { id } = req.params;

//   try {
//     const [rows] = await pool.query(
//       `SELECT p.*, u.name AS student_name
//        FROM  project_requests p
//        JOIN users u ON p.student_id = u.id
//        WHERE p.id = ?`,
//       [id]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     res.json({ project: rows[0] });
//   } catch (err) {
//     console.error("❌ Error fetching project:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.updateProjectStatus = async (req, res) => {
//   const { id } = req.params;
//   const { status, admin_notes } = req.body;

//   try {
//     await pool.query(
//       `UPDATE  project_requests SET status = ?, admin_notes = ? WHERE id = ?`,
//       [status, admin_notes, id]
//     );

//     res.json({ message: "Project status updated." });
//   } catch (err) {
//     console.error("❌ Error updating project:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.deleteProject = async (req, res) => {
//   const { id } = req.params;

//   try {
//     await pool.query(`DELETE FROM  project_requests WHERE id = ?`, [id]);
//     res.json({ message: "Project deleted successfully." });
//   } catch (err) {
//     console.error("❌ Error deleting project:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
const pool = require("../config/db");

exports.submitProjectRequest = async (req, res) => {
  console.log("📩 submitProjectRequest called");
  const { title, domain, tech_stack, current_stage, team_size, help_needed } =
    req.body;
  const user_id = req.user.id;

  try {
    await pool.query(
      `INSERT INTO project_requests 
       (user_id, title, domain, tech_stack, current_stage, team_size, help_needed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        title,
        domain,
        tech_stack,
        current_stage,
        team_size,
        help_needed,
      ]
    );

    res
      .status(201)
      .json({ message: "Project request submitted successfully." });
  } catch (err) {
    console.error("❌ Error submitting project:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllProjects = async (req, res) => {
  console.log("🧠 getAllProjects called");
  try {
    const [projects] = await pool.query(`
    SELECT 
  p.*, 
  u.name AS student_name, 
  u.email AS student_email
FROM 
  project_requests p
JOIN 
  users u ON p.user_id = u.id
ORDER BY 
  p.created_at DESC;

    `);
    res.json({ projects });
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.name AS student_name
       FROM project_requests p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ project: rows[0] });
  } catch (err) {
    console.error("❌ Error fetching project:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProjectStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query(`UPDATE project_requests SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);
    res.json({ message: "Project status updated." });
  } catch (err) {
    console.error("❌ Error updating project:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM project_requests WHERE id = ?`, [id]);
    res.json({ message: "Project deleted successfully." });
  } catch (err) {
    console.error("❌ Error deleting project:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
