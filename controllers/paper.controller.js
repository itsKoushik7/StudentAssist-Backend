// ------------------------------------------------ Above working fine for documented pdfs not for images below is working for images ------------------------------------------------

// const fs = require("fs");
// const pdfParse = require("pdf-parse");
// const pool = require("../config/db");
// const crypto = require("crypto");
// const { exec } = require("child_process");
// const { classifyUnit } = require("../ml/classifiers/unitClassifier");
// const { normalizeQuestion } = require("../utils/normalize");
// const Tesseract = require("tesseract.js");
// const { classifyUnitFromDB } = require("../ml/classifiers/classifyUnitFromDB");

// const extractQuestions = (text) => {
//   const lines = text.split("\n").map((l) => l.trim());
//   const questions = [];

//   for (let line of lines) {
//     if (line.length < 10) continue;

//     const parts = line.split(/(?=[a-d]\))/i);

//     for (let part of parts) {
//       const cleaned = part.trim();
//       if (cleaned.length > 10 && /[a-z]\)/i.test(cleaned)) {
//         questions.push(cleaned);
//       } else if (cleaned.length > 10 && /[\?\.:]$/.test(cleaned)) {
//         questions.push(cleaned);
//       }
//     }
//   }

//   return questions;
// };

// const generateHash = (text) =>
//   crypto.createHash("sha256").update(text).digest("hex");

// const detectAnswerType = (text) => {
//   console.log("Detecting answer type for:", text);
//   const match = text.match(/\[(\d+)\+?(\d+)?\]/);
//   if (match) {
//     const mark1 = parseInt(match[1]);
//     const mark2 = match[2] ? parseInt(match[2]) : 0;
//     const total = mark1 + mark2;
//     return total >= 8 ? "long" : "short";
//   }
//   return "long";
// };

// const classifyWithML = (question) => {
//   return new Promise((resolve) => {
//     exec(`python ml/classifyML.py "${question}"`, (err, stdout) => {
//       if (err) {
//         console.error("Python ML Error:", err.message);
//         return resolve("Unknown Unit");
//       }
//       return resolve(stdout.trim());
//     });
//   });
// };

// const extractTextWithOCR = async (filePath) => {
//   try {
//     const result = await Tesseract.recognize(filePath, "eng");
//     return result.data.text;
//   } catch (err) {
//     console.error("❌ OCR Failed:", err);
//     return "";
//   }
// };

// exports.uploadPaper = async (req, res) => {
//   const userId = req.user.id;
//   const { subject_code, year, month } = req.body;
//   const file = req.file;

//   if (!file) return res.status(400).json({ message: "No file uploaded" });
//   if (!subject_code || !year || !month) {
//     return res
//       .status(400)
//       .json({ message: "Missing subject_code, month, or year" });
//   }

//   try {
//     console.log("📁 Uploaded File:", {
//       name: file.originalname,
//       mimetype: file.mimetype,
//       size: file.size,
//     });

//     const fileExt = file.mimetype;
//     let extractedText = "";

//     if (fileExt === "application/pdf") {
//       const dataBuffer = await fs.promises.readFile(file.path);
//       const pdfData = await pdfParse(dataBuffer);

//       if (!pdfData.text || pdfData.text.trim().length < 20) {
//         console.log("⚠️ Empty PDF text. Using OCR fallback...");
//         extractedText = await extractTextWithOCR(file.path);
//       } else {
//         extractedText = pdfData.text;
//       }
//     } else if (
//       fileExt.startsWith("image/") &&
//       (fileExt.includes("jpeg") ||
//         fileExt.includes("png") ||
//         fileExt.includes("jpg"))
//     ) {
//       console.log("🖼️ Using OCR on image file...");
//       extractedText = await extractTextWithOCR(file.path);
//     } else {
//       return res.status(400).json({ message: "Unsupported file type" });
//     }

//     const questions = extractQuestions(extractedText);
//     let inserted = 0;
//     let repeated = 0;

//     for (let q of questions) {
//       const questionText = q.trim();
//       const keywords = normalizeQuestion(questionText);
//       const hash = generateHash(keywords);
//       const lastAsked = `${month} ${year}`;

//       if (
//         !questionText ||
//         questionText.length < 10 ||
//         !/[a-z]/i.test(questionText)
//       ) {
//         continue; // skip noisy/invalid line
//       }
//       // let unit = classifyUnit(questionText);
//       let unit = await classifyUnitFromDB(questionText, subject_code);
//       // Convert to integer safely
//       if (!unit || isNaN(parseInt(unit))) {
//         unit = null;
//       } else {
//         unit = parseInt(unit);
//       }

//       // if (unit === "Unknown Unit") {
//       //   unit = await classifyWithML(questionText);
//       // }

//       const [existing] = await pool.query(
//         "SELECT id FROM questions WHERE question_hash = ?",
//         [hash]
//       );
//       console.log(
//         "Checking ",
//         subject_code,
//         questionText,
//         hash,
//         unit,
//         detectAnswerType(questionText),
//         1,
//         lastAsked,
//         userId,
//         keywords
//       );
//       if (!existing.length) {
//         await pool.query(
//           `INSERT INTO questions
//           (subject_code, question_text, question_hash, detected_unit, answer_type, repeat_count, last_asked_in, created_by, keywords)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             subject_code,
//             questionText,
//             hash,
//             unit,
//             detectAnswerType(questionText),
//             1,
//             lastAsked,
//             userId,
//             keywords,
//           ]
//         );
//         inserted++;
//       } else {
//         await pool.query(
//           `UPDATE questions
//            SET repeat_count = repeat_count + 1, last_asked_in = ?
//            WHERE question_hash = ?`,
//           [lastAsked, hash]
//         );
//         repeated++;
//       }
//     }

//     res.status(200).json({
//       message: "✅ Questions processed",
//       total: questions.length,
//       inserted,
//       repeated,
//     });
//   } catch (err) {
//     console.error("❌ Error processing file:", err);
//     res.status(500).json({ message: "Failed to process file" });
//   } finally {
//     try {
//       fs.unlinkSync(file.path);
//     } catch (e) {
//       console.warn("⚠️ Could not delete uploaded file:", file.path);
//     }
//   }
// };

// --------------------------------------------------------------------------------------------------------
// this is working but accuracy missing

// File: controllers/paper.controller.js
// const fs = require("fs");
// const pdfParse = require("pdf-parse");
// const pool = require("../config/db");
// const crypto = require("crypto");
// const { normalizeQuestion } = require("../utils/normalize");
// const Tesseract = require("tesseract.js");
// const { classifyUnitFromDB } = require("../ml/classifiers/classifyUnitFromDB");
// const { classifyUnitWithGroq } = require("../ml/classifiers/classifyWithGroq");
// const { getUnitDescriptions } = require("../utils/getUnitDescriptions");

// // const extractQuestions = (text) => {
// //   const lines = text.split("\n").map((l) => l.trim());
// //   const questions = [];

// //   for (let line of lines) {
// //     if (line.length < 10) continue;
// //     const parts = line.split(/(?=[a-d]\))/i);
// //     for (let part of parts) {
// //       const cleaned = part.trim();
// //       if (cleaned.length > 10 && /[a-z]\)/i.test(cleaned)) {
// //         questions.push(cleaned);
// //       } else if (cleaned.length > 10 && /[\?\.:]$/.test(cleaned)) {
// //         questions.push(cleaned);
// //       }
// //     }
// //   }

// //   return questions;
// // };

// const extractQuestions = (text) => {
//   const lines = text.split("\n").map((l) => l.trim());
//   const questions = [];

//   for (let line of lines) {
//     if (line.length < 10) continue;
//     if (
//       /common to|part\s?[ab]|answer all|note:|compulsory|instructions?/i.test(
//         line
//       ) ||
//       /^[ivx]+\)/i.test(line) || // roman bullet points
//       (/^[a-h]\)/i.test(line) && !/[?.:]/.test(line)) // option labels with no actual sentence
//     ) {
//       continue;
//     }

//     const parts = line.split(/(?=[a-d]\))/i);
//     for (let part of parts) {
//       const cleaned = part.trim();
//       if (cleaned.length < 10) continue;

//       const isValid =
//         /[a-z]\)/i.test(cleaned) ||
//         /[\?\.:]$/.test(cleaned) ||
//         cleaned.length > 30;

//       const skipNonQuestion =
//         /(common to|part\s?[ab]|note:|instructions?|marks|sub questions)/i.test(
//           cleaned
//         );

//       if (isValid && !skipNonQuestion) {
//         questions.push(cleaned);
//       }
//     }
//   }

//   return questions;
// };

// const generateHash = (text) =>
//   crypto.createHash("sha256").update(text).digest("hex");

// const detectAnswerType = (text) => {
//   const match = text.match(/\[(\d+)\+?(\d+)?\]/);
//   if (match) {
//     const mark1 = parseInt(match[1]);
//     const mark2 = match[2] ? parseInt(match[2]) : 0;
//     const total = mark1 + mark2;
//     return total >= 8 ? "long" : "short";
//   }
//   return "long";
// };

// const extractTextWithOCR = async (filePath) => {
//   try {
//     const result = await Tesseract.recognize(filePath, "eng");
//     return result.data.text;
//   } catch (err) {
//     console.error("❌ OCR Failed:", err);
//     return "";
//   }
// };

// exports.uploadPaper = async (req, res) => {
//   const userId = req.user.id;
//   const { subject_code, year, month } = req.body;
//   const file = req.file;

//   if (!file || !subject_code || !year || !month) {
//     return res.status(400).json({ message: "Missing required data or file" });
//   }

//   try {
//     const fileExt = file.mimetype;
//     let extractedText = "";

//     if (fileExt === "application/pdf") {
//       const buffer = await fs.promises.readFile(file.path);
//       const pdf = await pdfParse(buffer);
//       extractedText =
//         pdf.text.trim().length < 20
//           ? await extractTextWithOCR(file.path)
//           : pdf.text;
//     } else if (fileExt.startsWith("image/")) {
//       extractedText = await extractTextWithOCR(file.path);
//     } else {
//       return res.status(400).json({ message: "Unsupported file type" });
//     }

//     const questions = extractQuestions(extractedText);
//     let inserted = 0;
//     let repeated = 0;

//     for (const q of questions) {
//       const questionText = q.trim();
//       if (questionText.length < 10 || !/[a-z]/i.test(questionText)) continue;

//       const keywords = normalizeQuestion(questionText);
//       const hash = generateHash(keywords);
//       const lastAsked = `${month.slice(0, 3)}${year}`;
//       let unit = await classifyUnitFromDB(questionText, subject_code);

//       if (!unit) {
//         const unitDescriptions = await getUnitDescriptions(subject_code);
//         if (Object.keys(unitDescriptions).length > 0) {
//           unit = await classifyUnitWithGroq(questionText, unitDescriptions);
//         }
//       }

//       const parsedUnit = parseInt(unit);
//       unit = isNaN(parsedUnit) ? null : parsedUnit;

//       const answerType = detectAnswerType(questionText);
//       const [existing] = await pool.query(
//         "SELECT id FROM questions WHERE question_hash = ?",
//         [hash]
//       );

//       if (!existing.length) {
//         await pool.query(
//           `INSERT INTO questions (subject_code, question_text, question_hash, detected_unit, answer_type, repeat_count, last_asked_in, created_by, keywords)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             subject_code,
//             questionText,
//             hash,
//             unit,
//             answerType,
//             1,
//             lastAsked,
//             userId,
//             keywords,
//           ]
//         );
//         inserted++;
//       } else {
//         await pool.query(
//           `UPDATE questions SET repeat_count = repeat_count + 1, last_asked_in = ? WHERE question_hash = ?`,
//           [lastAsked, hash]
//         );
//         repeated++;
//       }
//     }

//     res.status(200).json({
//       message: "✅ Questions processed",
//       total: questions.length,
//       inserted,
//       repeated,
//     });
//   } catch (err) {
//     console.error("❌ Error processing file:", err);
//     res.status(500).json({ message: "Failed to process file" });
//   } finally {
//     try {
//       fs.unlinkSync(file.path);
//     } catch (e) {}
//   }
// };

//============================================================================================

// // File: controllers/paper.controller.js
// const fs = require("fs");
// const pdfParse = require("pdf-parse");
// const pool = require("../config/db");
// const crypto = require("crypto");
// const { normalizeQuestion } = require("../utils/normalize");
// const Tesseract = require("tesseract.js");
// const { classifyUnitFromDB } = require("../ml/classifiers/classifyUnitFromDB");
// const { classifyUnitWithGroq } = require("../ml/classifiers/classifyWithGroq");
// const { getUnitDescriptions } = require("../utils/getUnitDescriptions");

// const extractQuestions = (text) => {
//   const lines = text.split("\n").map((l) => l.trim());
//   const questions = [];

//   for (let line of lines) {
//     if (line.length < 10) continue;
//     if (
//       /common to|part\s?[ab]|answer all|note:|compulsory|instructions?|semester|year|examinations?|university|b\.?\s?tech/i.test(
//         line
//       ) ||
//       /^[A-Z\s\-\d]{5,}$/.test(line) || // ALL CAPS lines (subject names)
//       (line.split(" ").length < 6 && /^[A-Z\s]{5,}$/.test(line)) // short uppercase line
//     ) {
//       continue;
//     }

//     const parts = line.split(/(?=[a-d]\))/i);
//     for (let part of parts) {
//       const cleaned = part.trim();
//       if (cleaned.length < 10) continue;

//       const isValid =
//         /[a-z]\)/i.test(cleaned) ||
//         /[\?\.:]$/.test(cleaned) ||
//         cleaned.length > 30;

//       const skipNonQuestion =
//         /(common to|part\s?[ab]|note:|instructions?|marks|sub questions|semester|year|university|b\.\s?tech)/i.test(
//           cleaned
//         );

//       if (isValid && !skipNonQuestion) {
//         questions.push(cleaned);
//       }
//     }
//   }

//   return questions;
// };

// const generateHash = (text) =>
//   crypto.createHash("sha256").update(text).digest("hex");

// const detectAnswerType = (text) => {
//   const match = text.match(/\[(\d+)\+?(\d+)?\]/);
//   if (match) {
//     const mark1 = parseInt(match[1]);
//     const mark2 = match[2] ? parseInt(match[2]) : 0;
//     const total = mark1 + mark2;
//     return total >= 8 ? "long" : "short";
//   }
//   return "long";
// };

// const extractTextWithOCR = async (filePath) => {
//   try {
//     const result = await Tesseract.recognize(filePath, "eng");
//     return result.data.text;
//   } catch (err) {
//     console.error("❌ OCR Failed:", err);
//     return "";
//   }
// };

// exports.uploadPaper = async (req, res) => {
//   const userId = req.user.id;
//   const { subject_code, year, month } = req.body;
//   const file = req.file;

//   if (!file || !subject_code || !year || !month) {
//     return res.status(400).json({ message: "Missing required data or file" });
//   }

//   try {
//     const fileExt = file.mimetype;
//     let extractedText = "";

//     if (fileExt === "application/pdf") {
//       const buffer = await fs.promises.readFile(file.path);
//       const pdf = await pdfParse(buffer);
//       extractedText =
//         pdf.text.trim().length < 20
//           ? await extractTextWithOCR(file.path)
//           : pdf.text;
//     } else if (fileExt.startsWith("image/")) {
//       extractedText = await extractTextWithOCR(file.path);
//     } else {
//       return res.status(400).json({ message: "Unsupported file type" });
//     }

//     const questions = extractQuestions(extractedText);
//     let inserted = 0;
//     let repeated = 0;

//     for (const q of questions) {
//       const questionText = q.trim();
//       if (questionText.length < 10 || !/[a-z]/i.test(questionText)) continue;

//       const keywords = normalizeQuestion(questionText);
//       const hash = generateHash(keywords);
//       const lastAsked = `${month.slice(0, 3)}${year}`;
//       let unit = await classifyUnitFromDB(questionText, subject_code);

//       if (!unit) {
//         const unitDescriptions = await getUnitDescriptions(subject_code);
//         if (Object.keys(unitDescriptions).length > 0) {
//           unit = await classifyUnitWithGroq(questionText, unitDescriptions);
//         }
//       }

//       const parsedUnit = parseInt(unit);
//       unit = isNaN(parsedUnit) ? null : parsedUnit;

//       const answerType = detectAnswerType(questionText);
//       const [existing] = await pool.query(
//         "SELECT id FROM questions WHERE question_hash = ?",
//         [hash]
//       );

//       if (!existing.length) {
//         await pool.query(
//           `INSERT INTO questions (subject_code, question_text, question_hash, detected_unit, answer_type, repeat_count, last_asked_in, created_by, keywords)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             subject_code,
//             questionText,
//             hash,
//             unit,
//             answerType,
//             1,
//             lastAsked,
//             userId,
//             keywords,
//           ]
//         );
//         inserted++;
//       } else {
//         await pool.query(
//           `UPDATE questions SET repeat_count = repeat_count + 1, last_asked_in = ? WHERE question_hash = ?`,
//           [lastAsked, hash]
//         );
//         repeated++;
//       }
//     }

//     res.status(200).json({
//       message: "✅ Questions processed",
//       total: questions.length,
//       inserted,
//       repeated,
//     });
//   } catch (err) {
//     console.error("❌ Error processing file:", err);
//     res.status(500).json({ message: "Failed to process file" });
//   } finally {
//     try {
//       fs.unlinkSync(file.path);
//     } catch (e) {}
//   }
// };

// ----------------------- above working extraordinary but repaeat count is not working properly -----------------------

// File: controllers/paper.controller.js   this is also working very fine but to avoid repeated questions which cause by intentional repeated uploads  go for next one
// const fs = require("fs");
// const pdfParse = require("pdf-parse");
// const pool = require("../config/db");
// const crypto = require("crypto");
// const { normalizeQuestion } = require("../utils/normalize");
// const Tesseract = require("tesseract.js");
// const { classifyUnitFromDB } = require("../ml/classifiers/classifyUnitFromDB");
// const { classifyUnitWithGroq } = require("../ml/classifiers/classifyWithGroq");
// const { getUnitDescriptions } = require("../utils/getUnitDescriptions");

// const extractQuestions = (text) => {
//   const lines = text.split("\n").map((l) => l.trim());
//   const questions = [];

//   for (let line of lines) {
//     if (line.length < 10) continue;
//     if (
//       /common to|part\s?[ab]|answer all|note:|compulsory|instructions?|semester|year|examinations?|university|b\.?\s?tech/i.test(
//         line
//       ) ||
//       /^[A-Z\s\-\d]{5,}$/.test(line) ||
//       (line.split(" ").length < 6 && /^[A-Z\s]{5,}$/.test(line))
//     ) {
//       continue;
//     }

//     const parts = line.split(/(?=[a-d]\))/i);
//     for (let part of parts) {
//       const cleaned = part.trim();
//       if (cleaned.length < 10) continue;

//       const isValid =
//         /[a-z]\)/i.test(cleaned) ||
//         /[\?\.:]$/.test(cleaned) ||
//         cleaned.length > 30;

//       const skipNonQuestion =
//         /(common to|part\s?[ab]|note:|instructions?|marks|sub questions|semester|year|university|b\.\s?tech)/i.test(
//           cleaned
//         );

//       if (isValid && !skipNonQuestion) {
//         questions.push(cleaned);
//       }
//     }
//   }

//   return questions;
// };

// const generateHash = (text) =>
//   crypto.createHash("sha256").update(text).digest("hex");

// const detectAnswerType = (text) => {
//   const match = text.match(/\[(\d+)\+?(\d+)?\]/);
//   if (match) {
//     const mark1 = parseInt(match[1]);
//     const mark2 = match[2] ? parseInt(match[2]) : 0;
//     const total = mark1 + mark2;
//     return total >= 8 ? "long" : "short";
//   }
//   return "long";
// };

// const extractTextWithOCR = async (filePath) => {
//   try {
//     const result = await Tesseract.recognize(filePath, "eng");
//     return result.data.text;
//   } catch (err) {
//     console.error("❌ OCR Failed:", err);
//     return "";
//   }
// };

// const jaccardSimilarity = (a, b) => {
//   const setA = new Set(a.split(" "));
//   const setB = new Set(b.split(" "));
//   const intersection = [...setA].filter((x) => setB.has(x));
//   const union = new Set([...setA, ...setB]);
//   return intersection.length / union.size;
// };

// exports.uploadPaper = async (req, res) => {
//   const userId = req.user.id;
//   const { subject_code, year, month } = req.body;
//   const file = req.file;

//   if (!file || !subject_code || !year || !month) {
//     return res.status(400).json({ message: "Missing required data or file" });
//   }

//   try {
//     const fileExt = file.mimetype;
//     let extractedText = "";

//     if (fileExt === "application/pdf") {
//       const buffer = await fs.promises.readFile(file.path);
//       const pdf = await pdfParse(buffer);
//       extractedText =
//         pdf.text.trim().length < 20
//           ? await extractTextWithOCR(file.path)
//           : pdf.text;
//     } else if (fileExt.startsWith("image/")) {
//       extractedText = await extractTextWithOCR(file.path);
//     } else {
//       return res.status(400).json({ message: "Unsupported file type" });
//     }

//     const questions = extractQuestions(extractedText);
//     // const normalizedPaperText = questions
//     //   .map((q) => normalizeQuestion(q))
//     //   .join(" ");
//     const normalizedPaperText = questions
//       .map((q) => normalizeQuestion(q).split(" ").sort().join(" "))
//       .join(" ");

//     const paperHash = generateHash(normalizedPaperText);

//     // Check if paperHash already exists
//     const [paperExists] = await pool.query(
//       "SELECT 1 FROM questions WHERE paper_hash = ? LIMIT 1",
//       [paperHash]
//     );

//     if (paperExists.length > 0) {
//       return res.status(409).json({
//         message: "⚠️ This question paper was already uploaded.",
//       });
//     }

//     let inserted = 0;
//     let repeated = 0;

//     for (const q of questions) {
//       const questionText = q.trim();
//       if (questionText.length < 10 || !/[a-z]/i.test(questionText)) continue;

//       const keywords = normalizeQuestion(questionText);
//       const hash = generateHash(keywords);
//       const lastAsked = `${month.slice(0, 3)}${year}`;
//       let unit = await classifyUnitFromDB(questionText, subject_code);

//       if (!unit) {
//         const unitDescriptions = await getUnitDescriptions(subject_code);
//         if (Object.keys(unitDescriptions).length > 0) {
//           unit = await classifyUnitWithGroq(questionText, unitDescriptions);
//         }
//       }

//       const parsedUnit = parseInt(unit);
//       unit = isNaN(parsedUnit) ? null : parsedUnit;

//       const answerType = detectAnswerType(questionText);

//       // Check exact match first
//       const [exactMatch] = await pool.query(
//         "SELECT id FROM questions WHERE question_hash = ?",
//         [hash]
//       );

//       if (exactMatch.length) {
//         await pool.query(
//           `UPDATE questions SET repeat_count = repeat_count + 1, last_asked_in = ? WHERE id = ?`,
//           [lastAsked, exactMatch[0].id]
//         );
//         repeated++;
//         continue;
//       }

//       // Semantic match fallback
//       const [existingQuestions] = await pool.query(
//         "SELECT id, keywords FROM questions WHERE subject_code = ?",
//         [subject_code]
//       );

//       let matchedId = null;
//       for (const row of existingQuestions) {
//         const sim = jaccardSimilarity(keywords, row.keywords);
//         if (sim >= 0.75) {
//           matchedId = row.id;
//           break;
//         }
//       }

//       if (matchedId) {
//         await pool.query(
//           `UPDATE questions SET repeat_count = repeat_count + 1, last_asked_in = ? WHERE id = ?`,
//           [lastAsked, matchedId]
//         );
//         repeated++;
//       } else {
//         await pool.query(
//           `INSERT INTO questions (
//             subject_code, question_text, question_hash, detected_unit,
//             answer_type, repeat_count, last_asked_in, created_by, keywords, paper_hash
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             subject_code,
//             questionText,
//             hash,
//             unit,
//             answerType,
//             1,
//             lastAsked,
//             userId,
//             keywords,
//             paperHash,
//           ]
//         );
//         inserted++;
//       }
//     }

//     res.status(200).json({
//       message: "✅ Questions processed",
//       total: questions.length,
//       inserted,
//       repeated,
//     });
//   } catch (err) {
//     console.error("❌ Error processing file:", err);
//     res.status(500).json({ message: "Failed to process file" });
//   } finally {
//     try {
//       fs.unlinkSync(file.path);
//     } catch (e) {}
//   }
// };

// this one for 95% of the time

// File: controllers/paper.controller.js
const fs = require("fs");
const pdfParse = require("pdf-parse");
const pool = require("../config/db");
const crypto = require("crypto");
const { normalizeQuestion } = require("../utils/normalize");
const Tesseract = require("tesseract.js");
const { classifyUnitFromDB } = require("../ml/classifiers/classifyUnitFromDB");
const { classifyUnitWithGroq } = require("../ml/classifiers/classifyWithGroq");
const { getUnitDescriptions } = require("../utils/getUnitDescriptions");

const extractQuestions = (text) => {
  const lines = text.split("\n").map((l) => l.trim());
  const questions = [];

  for (let line of lines) {
    if (line.length < 10) continue;
    if (
      /common to|part\s?[ab]|answer all|note:|compulsory|instructions?|semester|year|examinations?|university|b\.?\s?tech/i.test(
        line
      ) ||
      /^[A-Z\s\-\d]{5,}$/.test(line) ||
      (line.split(" ").length < 6 && /^[A-Z\s]{5,}$/.test(line))
    ) {
      continue;
    }

    const parts = line.split(/(?=[a-d]\))/i);
    for (let part of parts) {
      const cleaned = part.trim();
      if (cleaned.length < 10) continue;

      const isValid =
        /[a-z]\)/i.test(cleaned) ||
        /[\?\.:]$/.test(cleaned) ||
        cleaned.length > 30;

      // const skipNonQuestion =
      //   /(common to|part\s?[ab]|note:|instructions?|marks|sub questions|semester|year|university|b\.\s?tech)/i.test(
      //     cleaned
      //   );
      const skipNonQuestion =
        /(common to|part\s?[ab]|note:|instructions?|marks|sub questions|semester|year|university|b\.?\s?tech|code no:|time:|max\.? marks|[a-z]{2,}\s*\(?cse|ece|eee|civil|mechanical|it|ai&ml|aiml|csm|ds\)?)/i.test(
          cleaned
        );

      if (isValid && !skipNonQuestion) {
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

const extractTextWithOCR = async (filePath) => {
  try {
    const result = await Tesseract.recognize(filePath, "eng");
    return result.data.text;
  } catch (err) {
    console.error("❌ OCR Failed:", err);
    return "";
  }
};

const jaccardSimilarity = (a, b) => {
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));
  const intersection = [...setA].filter((x) => setB.has(x));
  const union = new Set([...setA, ...setB]);
  return intersection.length / union.size;
};

exports.uploadPaper = async (req, res) => {
  const userId = req.user.id;
  const { subject_code, year, month } = req.body;
  const file = req.file;
  const mathSubjects = ["MA101BS", "MA201BS", "CS303PC", "CS401PC", "CS741PE"];
  if (mathSubjects.includes(subject_code.toUpperCase())) {
    return res.status(200).json({
      message: "⏭️ Math subject skipped intentionally",
      inserted: 0,
      repeated: 0,
    });
  }

  if (!file || !subject_code || !year || !month) {
    return res.status(400).json({ message: "Missing required data or file" });
  }

  try {
    const fileExt = file.mimetype;
    let extractedText = "";

    if (fileExt === "application/pdf") {
      const buffer = await fs.promises.readFile(file.path);
      const pdf = await pdfParse(buffer);
      extractedText =
        pdf.text.trim().length < 20
          ? await extractTextWithOCR(file.path)
          : pdf.text;
    } else if (fileExt.startsWith("image/")) {
      extractedText = await extractTextWithOCR(file.path);
    } else {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    const questions = extractQuestions(extractedText);

    // ✅ Paper-level deduplication: skip if same paper is re-uploaded
    const normalizedPaper = questions
      .filter((q) => q.length > 30)
      .map((q) => normalizeQuestion(q))
      .join(" ");
    const paperHash = generateHash(normalizedPaper);

    const [paperExists] = await pool.query(
      "SELECT 1 FROM questions WHERE paper_hash = ? LIMIT 1",
      [paperHash]
    );

    if (paperExists.length > 0) {
      return res
        .status(409)
        .json({ message: "⚠️ This question paper was already uploaded." });
    }

    let inserted = 0;
    let repeated = 0;
    const lastAsked = `${month.slice(0, 3)}${year}`;

    for (const q of questions) {
      const questionText = q.trim();
      if (questionText.length < 10 || !/[a-z]/i.test(questionText)) continue;

      const keywords = normalizeQuestion(questionText);
      const hash = generateHash(keywords);
      let unit = await classifyUnitFromDB(questionText, subject_code);

      if (!unit) {
        const unitDescriptions = await getUnitDescriptions(subject_code);
        if (Object.keys(unitDescriptions).length > 0) {
          unit = await classifyUnitWithGroq(questionText, unitDescriptions);
        }
      }

      unit = parseInt(unit);
      if (isNaN(unit)) continue;
      if (isNaN(unit)) unit = null;

      const answerType = detectAnswerType(questionText);

      const [exactMatch] = await pool.query(
        "SELECT id FROM questions WHERE question_hash = ?",
        [hash]
      );

      if (exactMatch.length) {
        await pool.query(
          `UPDATE questions SET repeat_count = repeat_count + 1, last_asked_in = ? WHERE id = ?`,
          [lastAsked, exactMatch[0].id]
        );
        repeated++;
        continue;
      }

      const [existingQuestions] = await pool.query(
        "SELECT id, keywords FROM questions WHERE subject_code = ?",
        [subject_code]
      );

      let matchedId = null;
      for (const row of existingQuestions) {
        const sim = jaccardSimilarity(keywords, row.keywords);
        if (sim >= 0.75) {
          matchedId = row.id;
          break;
        }
      }

      if (matchedId) {
        await pool.query(
          `UPDATE questions SET repeat_count = repeat_count + 1, last_asked_in = ? WHERE id = ?`,
          [lastAsked, matchedId]
        );
        repeated++;
      } else {
        await pool.query(
          `INSERT INTO questions (subject_code, question_text, question_hash, detected_unit, answer_type, repeat_count, last_asked_in, created_by, keywords, paper_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            subject_code,
            questionText,
            hash,
            unit,
            answerType,
            1,
            lastAsked,
            userId,
            keywords,
            paperHash,
          ]
        );
        inserted++;
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
    } catch (e) {}
  }
};
