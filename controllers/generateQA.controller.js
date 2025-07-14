// const fs = require("fs");
// const path = require("path");
// const pool = require("../config/db");
// const PDFDocument = require("pdfkit");
// const { getAnswerFromGroq } = require("../utils/getAnswerFromGroq");

// exports.generateQAPdf = async (req, res) => {
//   const { subject_code } = req.query;
//   if (!subject_code) {
//     return res.status(400).json({ message: "subject_code is required" });
//   }

//   try {
//     // Step 1: Fetch questions
//     const [questions] = await pool.query(
//       `SELECT question_text FROM questions WHERE subject_code = ?`,
//       [subject_code]
//     );

//     if (!questions.length) {
//       return res.status(404).json({ message: "No questions found." });
//     }

//     // Step 2: Prepare PDF output path
//     const outputDir = path.join(__dirname, "../uploads/processed");
//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir, { recursive: true });
//     }

//     const filePath = path.join(outputDir, `${subject_code}-qa.pdf`);
//     const writeStream = fs.createWriteStream(filePath);
//     const doc = new PDFDocument();
//     doc.pipe(writeStream);

//     doc.fontSize(20).text(`Subject: ${subject_code}`, { underline: true });
//     doc.moveDown();

//     // Step 3: Loop through questions
//     let index = 1;
//     for (const q of questions) {
//       const question = q.question_text;
//       console.log(`🔄 Starting answer for question ${index}`);

//       const answer = await getAnswerFromGroq(question);
//       console.log(`✅ Answer received for question ${index}`);

//       doc.fontSize(14).fillColor("black").text(`${index}. ${question}`);
//       doc.moveDown(0.5);
//       doc.fontSize(12).fillColor("gray").text(`Answer: ${answer}`);
//       doc.moveDown(1);
//       index++;
//     }

//     doc.end();

//     // Step 4: Download file after writing finishes
//     writeStream.on("finish", () => {
//       console.log("📄 PDF generation complete. Starting download...");
//       res.download(filePath, `${subject_code}-qa.pdf`, (err) => {
//         if (err) {
//           console.error("❌ Download error:", err);
//           return res.status(500).send("Failed to download file.");
//         }

//         console.log("✅ PDF sent to client.");

//         fs.unlink(filePath, (unlinkErr) => {
//           if (unlinkErr) {
//             console.warn("⚠️ Failed to delete:", filePath);
//           } else {
//             console.log("🗑️ Temporary file deleted:", filePath);
//           }
//         });
//       });
//     });

//     writeStream.on("error", (err) => {
//       console.error("❌ PDF stream error:", err);
//       return res.status(500).send("PDF generation failed.");
//     });
//   } catch (err) {
//     console.error("❌ Error generating QA PDF:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
// ---------------------------above working

const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { getAnswerFromGroq } = require("../utils/getAnswerFromGroq");
const { generateQAPdfFile } = require("../utils/pdf/generateQA");

exports.generateQAPdf = async (req, res) => {
  const { subject_code, unit } = req.query;

  if (!subject_code) {
    return res.status(400).json({ message: "subject_code is required" });
  }

  try {
    // Step 1: Fetch questions
    const [questions] = await pool.query(
      `SELECT question_text FROM questions WHERE subject_code = ? and detected_unit = ?`,
      [subject_code, unit]
    );

    if (!questions.length) {
      return res.status(404).json({ message: "No questions found." });
    }

    // Step 2: Generate the PDF file
    const filePath = await generateQAPdfFile({
      questions,
      subject_code,
      getAnswer: getAnswerFromGroq,
    });

    // Step 3: Download using res.download()
    res.download(filePath, `${subject_code}-qa.pdf`, (err) => {
      if (err) {
        console.error("❌ Download error:", err);
        return res.status(500).send("Failed to download file.");
      }

      // Step 4: Delete after download
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.warn("⚠️ Failed to delete file:", filePath);
        } else {
          console.log("🗑️ Temporary file deleted:", filePath);
        }
      });
    });
  } catch (err) {
    console.error("❌ Error generating QA PDF:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
