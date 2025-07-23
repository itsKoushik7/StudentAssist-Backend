const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const { verifyToken } = require("./middleware/authMiddleware");

const userRoutes = require("./routes/user.routes");
const paperRoutes = require("./routes/paper.routes");
const qaRoutes = require("./routes/qa.routes");
const subjectRoutes = require("./routes/subject.routes");
const resumeRoutes = require("./routes/resumeRoutes");
const projectRoutes = require("./routes/projectRoutes");
const feedbackRoutes = require("./routes/feedback");

const app = express();

// app.use(cors());
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*", // Vercel domain for production, * for dev
  credentials: true,
};

app.use(cors(corsOptions));

app.use(bodyParser.json());

app.use("/api/users", userRoutes);
app.use("/api/papers", paperRoutes);
app.use("/api/qa", qaRoutes);
app.use("/api/colleges", require("./routes/collegeRoutes"));
app.use("/api/subjects", subjectRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/feedback", feedbackRoutes);
// app.use("/api/qa", qaRoutes);
// router.post("/login", loginUser);

app.get("/", (req, res) => {
  res.send("Student Assist API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
