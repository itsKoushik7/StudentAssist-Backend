const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const getStream = require("get-stream");

/**
 * Generates a PDF mock test report.
 * @param {Array} evaluation - Array of { question, answer, correct }
 * @param {number} correctCount
 * @param {number} total
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateMockReportPDF(evaluation, correctCount, total) {
  const doc = new PDFDocument({ margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);

  // Title
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("Mock Test Report", { align: "center" })
    .moveDown(1);

  // Summary
  doc
    .font("Helvetica")
    .fontSize(12)
    .text(`Total Questions: ${total}`, { continued: true })
    .text(`   Correct: ${correctCount}`, { continued: true })
    .text(`   Incorrect: ${total - correctCount}`)
    .moveDown();

  // Evaluation Section
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Detailed Evaluation", { underline: true })
    .moveDown(0.5);

  evaluation.forEach(({ question, answer, correct }, index) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`Q${index + 1}: ${question}`);
    doc
      .font("Helvetica")
      .fontSize(11)
      .text(`Your Answer: ${answer || "No answer provided"}`, { indent: 10 });
    doc
      .font("Helvetica-Oblique")
      .fillColor(correct ? "green" : "red")
      .text(correct ? "✓ Correct" : "✗ Incorrect", { indent: 10 });
    doc.fillColor("black").moveDown(0.8);
  });

  doc.end();
  return await getStream.buffer(stream);
}

module.exports = { generateMockReportPDF };
