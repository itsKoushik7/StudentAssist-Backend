const PDFDocument = require("pdfkit");

function drawHeading(doc, text, y) {
  doc
    .fontSize(11)
    .fillColor("#444444")
    .text(text.toUpperCase(), 50, y, { align: "left", width: 500 })
    .fillColor("black")
    .moveDown(0.5);
}

function drawSectionLine(doc, y) {
  doc.moveTo(50, y).lineTo(545, y).strokeColor("#dddddd").lineWidth(1).stroke();
}

function addBulletList(doc, items, indentX = 70, lineHeight = 14) {
  items.forEach((item, i) => {
    doc
      .circle(indentX, doc.y + 5, 2)
      .fill("#555555")
      .fillColor("black")
      .fontSize(10)
      .text(item, indentX + 10, doc.y - 2);
    doc.moveDown(0.3);
  });
}

exports.createMinimalisticResume = async (data) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  // Header
  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor("#000000")
    .text(data.name, 50, 50, { align: "center", width: 500 })
    .moveDown(1);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#444444")
    .text(`Contact Information`, 50, doc.y)
    .moveDown(0.2)
    .text(`${data.phone}  ${data.email}`, 70, doc.y, { align: "left" })
    .moveDown(0.5);

  doc
    .fontSize(10)
    .fillColor("#0077b5")
    .text(`Portfolio Link`, 70, doc.y, {
      link: data.portfolio,
      underline: true,
    })
    .moveDown(1);

  drawSectionLine(doc, doc.y + 5);

  // Work Experience
  drawHeading(doc, "Work Experience", doc.y + 15);
  data.experience.forEach((exp) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(exp.role, 70, doc.y)
      .font("Helvetica")
      .fontSize(10)
      .text(exp.company, 70, doc.y + 15);
    if (Array.isArray(exp.description)) {
      addBulletList(doc, exp.description);
    }
    doc.moveDown(0.5);
  });

  drawSectionLine(doc, doc.y + 5);

  // Relevant Skills
  drawHeading(doc, "Relevant Skills", doc.y + 15);
  let skillList = [];
  if (Array.isArray(data.skills)) {
    skillList = data.skills;
  } else if (typeof data.skills === "object" && data.skills !== null) {
    skillList = Object.values(data.skills).flat();
  }
  addBulletList(doc, skillList);

  drawSectionLine(doc, doc.y + 5);

  // Educational History
  drawHeading(doc, "Educational History", doc.y + 15);
  data.education.forEach((edu) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(edu.school, 70, doc.y)
      .font("Helvetica")
      .fontSize(10)
      .text(edu.degree, 70, doc.y + 15)
      .text(`(${edu.year})`, 70, doc.y + 25);
    doc.moveDown(0.5);
  });

  drawSectionLine(doc, doc.y + 5);

  // Awards
  drawHeading(doc, "Awards", doc.y + 15);
  addBulletList(doc, data.achievements);

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on("error", reject);
  });
};
