const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");
const auth = require("../middleware/authMiddleware");

const {
  getAllProjects,
  getProjectById,
  submitProjectRequest,
  updateProjectStatus,
  deleteProject,
} = projectController;

const { verifyToken } = auth; // ❌ no isAdmin — remove it

// Student route
router.post("/new", verifyToken, submitProjectRequest);

// Admin routes (temporarily without isAdmin)
router.get("/admin/all", verifyToken, getAllProjects);
router.get("/admin/:id", verifyToken, getProjectById);
router.put("/admin/:id", verifyToken, updateProjectStatus);
router.delete("/admin/:id", verifyToken, deleteProject);

module.exports = router;
