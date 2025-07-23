const db = require("../config/db"); // adjust path based on your project setup

exports.submitFeedback = async (req, res) => {
  const { context, rating, feedback } = req.body;

  if (!context || !rating) {
    return res.status(400).json({ message: "Context and rating are required" });
  }

  try {
    const cleanComment = (feedback || "").replace(/\n/g, " ");

    await db.query(
      "INSERT INTO feedback (context, rating, comments) VALUES (?, ?, ?)",
      [context, rating, cleanComment || null]
    );
    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (err) {
    console.error("❌ Error submitting feedback:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
