const fs = require("fs");
const pdfParse = require("pdf-parse");
const pool = require("../config/db");
const crypto = require("crypto");
const { exec } = require("child_process");
const { classifyUnit } = require("../ml/classifiers/unitClassifier");
const { normalizeQuestion } = require("../utils/normalize");

const extractQuestions = (text) => {
  const lines = text.split("\n").map((l) => l.trim());
  const questions = [];

  for (let line of lines) {
    if (line.length < 10) continue;

    const parts = line.split(/(?=[a-d]\))/i);

    for (let part of parts) {
      const cleaned = part.trim();
      if (cleaned.length > 10 && /[a-z]\)/i.test(cleaned)) {
        questions.push(cleaned);
      } else if (cleaned.length > 10 && /[\?\.:]$/.test(cleaned)) {
        questions.push(cleaned);
      }
    }
  }

  return questions;
};

const generateHash = (text) =>
  crypto.createHash("sha256").update(text).digest("hex");

const detectAnswerType = (text) => {
  const match = text.match(/\[(\d+)\+?(\d+)?\]/);
  if (match) {
    const mark1 = parseInt(match[1]);
    const mark2 = match[2] ? parseInt(match[2]) : 0;
    const total = mark1 + mark2;
    return total >= 8 ? "long" : "short";
  }
  return "long";
};

const classifyWithML = (question) => {
  return new Promise((resolve) => {
    exec(`python ml/classifyML.py "${question}"`, (err, stdout) => {
      if (err) {
        console.error("Python ML Error:", err.message);
        return resolve("Unknown Unit");
      }
      return resolve(stdout.trim());
    });
  });
};

exports.uploadPaper = async (req, res) => {
  const userId = req.user.id;
  const { subject_code, year, month } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: "No file uploaded" });
  if (!subject_code || !year || !month) {
    return res
      .status(400)
      .json({ message: "Missing subject_code, month, or year" });
  }

  try {
    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text;
    const questions = extractQuestions(extractedText);

    let inserted = 0;
    let repeated = 0;

    for (let q of questions) {
      const questionText = q.trim();
      const keywords = normalizeQuestion(questionText);
      const hash = generateHash(keywords);
      const lastAsked = `${month} ${year}`;

      let unit = classifyUnit(questionText);

      if (unit === "Unknown Unit") {
        unit = await classifyWithML(questionText);
      }

      if (unit === "Unknown Unit" || isNaN(unit)) {
        unit = null;
      } else {
        unit = parseInt(unit);
      }

      const [existing] = await pool.query(
        "SELECT id FROM questions WHERE question_hash = ?",
        [hash]
      );

      if (!existing.length) {
        await pool.query(
          `INSERT INTO questions 
          (subject_code, question_text, question_hash, detected_unit, answer_type, repeat_count, last_asked_in, created_by, keywords) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            subject_code,
            questionText,
            hash,
            unit,
            detectAnswerType(questionText),
            1,
            lastAsked,
            userId,
            keywords,
          ]
        );
        inserted++;
      } else {
        await pool.query(
          `UPDATE questions 
           SET repeat_count = repeat_count + 1, last_asked_in = ? 
           WHERE question_hash = ?`,
          [lastAsked, hash]
        );
        repeated++;
      }
    }

    res.status(200).json({
      message: "✅ Questions processed",
      total: questions.length,
      inserted,
      repeated,
    });
  } catch (err) {
    console.error("❌ Error processing file:", err);
    res.status(500).json({ message: "Failed to process file" });
  } finally {
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      console.warn("⚠️ Could not delete uploaded file:", file.path);
    }
  }
};
