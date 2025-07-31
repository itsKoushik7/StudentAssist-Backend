const { evaluateAnswer } = require("../utils/groq/evaluateAnswer");
const { generateMockReportPDF } = require("../utils/pdf/mockReport");
const pool = require("../config/db");

function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ==============================
// POST /api/mock/generate
// ==============================
exports.generateMock = async (req, res) => {
  try {
    const { experienceLevel, role, technology } = req.body;

    const [rows] = await pool.query(
      `SELECT question FROM mock_questions 
       WHERE experience_level = ? AND role = ? AND technology = ?`,
      [experienceLevel, role, technology]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No questions found for given parameters." });
    }

    const questions = shuffleArray(rows.map((q) => q.question)).slice(0, 30);
    res.json({ questions });
  } catch (err) {
    console.error("🔥 Error fetching mock questions:", err);
    res.status(500).json({ error: "Failed to fetch mock questions." });
  }
};

// ==============================
// POST /api/mock/submit
// ==============================
exports.submitMock = async (req, res) => {
  try {
    const { userId, role, technology, experienceLevel, answers } = req.body;

    let correctCount = 0;
    const evaluation = [];

    for (const { question, userAnswer } of answers) {
      const trimmedAnswer = userAnswer?.trim?.() || "";
      let isCorrect = false;

      if (trimmedAnswer !== "" && trimmedAnswer !== "<p><br></p>") {
        try {
          isCorrect = await evaluateAnswer(question, trimmedAnswer);
          await sleep(1000); // optional throttling
        } catch (err) {
          console.error(`⚠️ Error evaluating: ${question}`, err.message);
        }
      }

      if (isCorrect) correctCount++;

      evaluation.push({
        question,
        answer: trimmedAnswer,
        correct: isCorrect,
      });
    }

    const total = answers.length;
    const score = ((correctCount / total) * 100).toFixed(2);

    await pool.query(
      `INSERT INTO mocks 
        (user_id, role, technology, experience_level, total_questions, correct_answers, score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, role, technology, experienceLevel, total, correctCount, score]
    );

    const pdfBuffer = await generateMockReportPDF(
      evaluation,
      correctCount,
      total
    );

    // res.set({
    //   "Content-Type": "application/pdf",
    //   "Content-Disposition": `attachment; filename=mock_result.pdf`,
    // });

    // res.send(pdfBuffer);
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=mock_result.pdf",
      "Content-Length": pdfBuffer.length,
    });

    res.end(pdfBuffer);
  } catch (err) {
    console.error("🔥 Error evaluating mock answers:", err);
    res.status(500).json({ error: "Failed to evaluate mock." });
  }
};

exports.getMockFilters = async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT DISTINCT role, technology FROM mock_questions WHERE role IS NOT NULL AND technology IS NOT NULL`
    );

    const filters = {};

    // Group roles and technologies into separate unique arrays
    filters.roles = [...new Set(results.map((r) => r.role))].filter(Boolean);
    filters.technologies = [
      ...new Set(results.map((r) => r.technology)),
    ].filter(Boolean);

    res.json(filters);
  } catch (err) {
    console.error("🔥 Error fetching mock filters:", err);
    res.status(500).json({ error: "Failed to fetch mock filters." });
  }
};
