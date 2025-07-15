// // utils/pdf/generateQA.js
// const fs = require("fs");
// const path = require("path");
// const PDFDocument = require("pdfkit");

// async function generateQAPdfFile({ questions, subject_code, getAnswer }) {
//   const outputDir = path.join(__dirname, "../../uploads/processed");
//   if (!fs.existsSync(outputDir)) {
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   const filePath = path.join(outputDir, `${subject_code}-qa.pdf`);
//   const doc = new PDFDocument();
//   const writeStream = fs.createWriteStream(filePath);
//   doc.pipe(writeStream);

//   doc.fontSize(20).fillColor("black").text(`Subject: ${subject_code}`, {
//     underline: true,
//   });
//   doc.moveDown();

//   let index = 1;
//   for (const q of questions) {
//     const question = q.question_text;
//     console.log(`🔄 Starting answer for question ${index}`);
//     const answer = await getAnswer(question); // injected dependency
//     console.log(`✅ Answer received for question ${index}`);

//     // Format
//     doc.fontSize(14).fillColor("black").text(`${index}. ${question}`, {
//       width: 500,
//       align: "left",
//     });
//     doc.moveDown(0.5);

//     if (answer === "Answer generation failed.") {
//       doc
//         .fontSize(12)
//         .fillColor("red")
//         .text(`Answer: ${answer}`, { width: 480, align: "left" });
//     } else {
//       doc
//         .fontSize(12)
//         .fillColor("gray")
//         .text(`Answer: ${answer}`, { width: 480, align: "left" });
//     }

//     doc.moveDown(1.5);
//     index++;
//   }

//   doc.end();

//   return new Promise((resolve, reject) => {
//     writeStream.on("finish", () => resolve(filePath));
//     writeStream.on("error", reject);
//   });
// }

// module.exports = { generateQAPdfFile };

// ------------------- working version -------------------

// utils/pdf/generateQA.js    this is working version but it is very simple layout

// const fs = require("fs");
// const path = require("path");
// const PDFDocument = require("pdfkit");
// const { formatAnswerForPDF } = require("../cleanText");
// async function generateQAPdfFile({ questions, subject_code, getAnswer }) {
//   if (typeof getAnswer !== "function") {
//     throw new Error("getAnswer must be a valid function");
//   }

//   const outputDir = path.join(__dirname, "../../uploads/processed");
//   if (!fs.existsSync(outputDir)) {
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   const filePath = path.join(outputDir, `${subject_code}-qa.pdf`);
//   const doc = new PDFDocument({ margin: 50 });
//   const writeStream = fs.createWriteStream(filePath);
//   doc.pipe(writeStream);

//   doc.fontSize(20).fillColor("black").text(`Subject: ${subject_code}`, {
//     underline: true,
//     align: "center",
//   });
//   doc.moveDown(1.5);

//   let index = 1;
//   for (const q of questions) {
//     const question = q.question_text?.trim();
//     if (!question) continue;

//     console.log(`🔄 Starting answer for question ${index}`);
//     const answer = await getAnswer(question);
//     console.log(`✅ Answer received for question ${index}`);

//     const cleanedAnswer = formatAnswerForPDF(answer);
//     const isFailed = answer === "Answer generation failed.";

//     doc.fontSize(14).fillColor("black").text(`${index}. ${question}`, {
//       width: 480,
//       align: "left",
//     });
//     doc.moveDown(0.5);

//     doc
//       .fontSize(12)
//       // .fillColor(answer.includes("failed") ? "red" : "gray")
//       .fillColor(isFailed ? "red" : "gray")
//       .text(`Answer:\n${cleanedAnswer}`, {
//         width: 460,
//         align: "left",
//       });

//     doc.moveDown(1.5);
//     index++;
//   }

//   doc.end();

//   return new Promise((resolve, reject) => {
//     writeStream.on("finish", () => resolve(filePath));
//     writeStream.on("error", reject);
//   });
// }

// module.exports = { generateQAPdfFile };

// File: utils/pdf/generateQAPdfFile.js
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { formatAnswerForPDF } = require("../cleanText");

async function generateQAPdfFile({ questions, subject_code, getAnswer }) {
  if (typeof getAnswer !== "function") {
    throw new Error("getAnswer must be a valid function");
  }

  const outputDir = path.join(__dirname, "../../uploads/processed");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, `${subject_code}-qa.pdf`);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  const generatedDate = new Date().toLocaleDateString("en-GB");

  // Header
  doc
    .fontSize(20)
    .fillColor("black")
    .text(`Subject: ${subject_code}`, { align: "center" })
    .moveDown(0.5)
    .fontSize(12)
    .fillColor("gray")
    .text(`Generated on: ${generatedDate}`, { align: "center" })
    .moveDown(0.2)
    .text(`Total Questions: ${questions.length}`, { align: "center" })
    .moveDown(1.5);

  let index = 1;
  for (const q of questions) {
    const question = q.question_text?.trim();
    if (!question) continue;

    console.log(`🔄 Starting answer for question ${index}`);
    const answer = await getAnswer(question);
    console.log(`✅ Answer received for question ${index}`);

    const cleanedAnswer = formatAnswerForPDF(answer);
    const isFailed = answer === "Answer generation failed.";

    // Render question
    doc
      .fontSize(13)
      .fillColor("black")
      .text(`${index}. ${question}`, {
        width: 480,
        align: "left",
        lineGap: 4,
      })
      .moveDown(0.5);

    // Render answer
    doc
      .fontSize(12)
      .fillColor(isFailed ? "red" : "gray")
      .text(`Answer:`, {
        underline: true,
        continued: false,
      })
      .moveDown(0.2)
      .font("Times-Roman")
      .text(cleanedAnswer, {
        width: 460,
        align: "left",
        lineGap: 4,
      })
      .moveDown(2);

    index++;
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", reject);
  });
}

module.exports = { generateQAPdfFile };
