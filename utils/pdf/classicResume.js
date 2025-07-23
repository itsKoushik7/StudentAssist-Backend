const PDFDocument = require("pdfkit");
const getStream = require("get-stream");

function cleanBulletPoints(text) {
  const points = text
    .split(/[•\n]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return points;
}

exports.createClassicResume = async (data) => {
  const doc = new PDFDocument({ margin: 50 });
  const stream = doc.pipe(require("stream").PassThrough());

  const ACCENT_COLOR = "#1F4E79";
  const sectionTitleStyle = { underline: true };

  // Header - Name in blue
  doc
    .fillColor(ACCENT_COLOR)
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(data.name, { align: "center" })
    .fillColor("black");
  doc.moveDown(0.5);

  const headerDetails = [data.email, data.phone, data.linkedin, data.github]
    .filter(Boolean)
    .join(" | ");
  doc.fontSize(10).font("Helvetica").text(headerDetails, { align: "center" });
  doc.moveDown(1);

  // Summary
  if (data.summary) {
    doc
      .fontSize(12)
      .fillColor(ACCENT_COLOR)
      .font("Helvetica-Bold")
      .text("Professional Summary", sectionTitleStyle)
      .fillColor("black");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").text(data.summary);
    doc.moveDown(1);
  }

  // Skills
  if (data.skills && typeof data.skills === "object") {
    doc
      .fontSize(12)
      .fillColor(ACCENT_COLOR)
      .font("Helvetica-Bold")
      .text("Technical Skills", sectionTitleStyle)
      .fillColor("black");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica");

    Object.entries(data.skills).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        const label = key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        doc.text(`• ${label}: ${value.join(", ")}`);
        doc.moveDown(0.3);
      }
    });

    doc.moveDown(0.7);
  }

  // Education
  if (data.education && data.education.length > 0) {
    doc
      .fontSize(12)
      .fillColor(ACCENT_COLOR)
      .font("Helvetica-Bold")
      .text("Education", sectionTitleStyle)
      .fillColor("black");
    doc.moveDown(0.3);
    data.education.forEach((edu) => {
      doc.fontSize(10).font("Helvetica-Bold").text(`${edu.school}`);
      doc.font("Helvetica").text(`${edu.degree}`);
      doc.text(
        `${edu.year}${edu.cgpa ? ` | CGPA: ${edu.cgpa}` : ""}${
          edu.percentage ? ` | ${edu.percentage}` : ""
        }`
      );
      doc.moveDown(0.7);
    });
  }

  // Experience
  const validExperience = data.experience?.filter(
    (exp) =>
      exp.company.trim() !== "" ||
      exp.role.trim() !== "" ||
      exp.duration.trim() !== "" ||
      exp.description.trim() !== ""
  );

  if (validExperience && validExperience.length > 0) {
    doc
      .fontSize(12)
      .fillColor(ACCENT_COLOR)
      .font("Helvetica-Bold")
      .text("Professional Experience", sectionTitleStyle)
      .fillColor("black");
    doc.moveDown(0.3);
    data.experience.forEach((exp) => {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("black")
        .text(`${exp.role} at ${exp.company} `, { continued: true }) // main text

        .font("Helvetica-Oblique")
        .fillColor("black")
        .text(`(${exp.duration})`) // italic grey part
        .fillColor("black"); // reset to default

      doc.moveDown(0.2);
      if (exp.description) {
        const points = cleanBulletPoints(exp.description.replace(/\n/g, " "));
        doc.fontSize(9).font("Helvetica").list(points, { bulletIndent: 20 });
      }
      doc.moveDown(0.5);
    });
    doc.moveDown(0.5);
  }

  // Certifications
  const validCerts = data.certifications?.filter(
    (cert) =>
      cert.title.trim() !== "" ||
      cert.issuer.trim() !== "" ||
      cert.year.trim() !== ""
  );

  if (validCerts && validCerts.length > 0) {
    doc
      .fontSize(12)
      .fillColor(ACCENT_COLOR)
      .font("Helvetica-Bold")
      .text("Certifications", sectionTitleStyle)
      .fillColor("black");
    doc.moveDown(0.3);
    data.certifications.forEach((cert) => {
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`• ${cert.title} - ${cert.issuer} (${cert.year})`);
    });
    doc.moveDown(1);
  }

  // Projects
  const validProjects = data.projects?.filter(
    (p) => p.title.trim() !== "" || p.description.trim() !== ""
  );

  if (validProjects && validProjects.length > 0) {
    doc
      .fontSize(12)
      .fillColor(ACCENT_COLOR)
      .font("Helvetica-Bold")
      .text("Projects", sectionTitleStyle)
      .fillColor("black");
    doc.moveDown(0.3);
    data.projects.forEach((proj) => {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`${proj.title}${proj.link ? " - " + proj.link : ""}`);
      doc.moveDown(0.2);
      doc.fontSize(9).font("Helvetica").text(proj.description, { indent: 20 });
      doc.moveDown(0.5);
    });
  }

  // Achievements
  if (data.achievements && data.achievements.length > 0) {
    doc
      .fontSize(12)
      .fillColor(ACCENT_COLOR)
      .font("Helvetica-Bold")
      .text("Achievements", sectionTitleStyle)
      .fillColor("black");
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font("Helvetica")
      .list(data.achievements, { bulletIndent: 20 });
    doc.moveDown(1);
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    doc
      .fontSize(12)
      .fillColor(ACCENT_COLOR)
      .font("Helvetica-Bold")
      .text("Languages Known", sectionTitleStyle)
      .fillColor("black");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").text(data.languages.join(", "));
    doc.moveDown(1);
  }

  // Hobbies
  if (data.hobbies && data.hobbies.length > 0) {
    doc
      .fontSize(12)
      .fillColor(ACCENT_COLOR)
      .font("Helvetica-Bold")
      .text("Hobbies & Interests", sectionTitleStyle)
      .fillColor("black");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").text(data.hobbies.join(", "));
    doc.moveDown(1);
  }

  // Location
  if (data.location) {
    doc
      .fontSize(12)
      .fillColor(ACCENT_COLOR)
      .font("Helvetica-Bold")
      .text("Location", sectionTitleStyle)
      .fillColor("black");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").text(data.location);
    doc.moveDown(1);
  }

  doc.end();
  const buffer = await getStream.buffer(stream);
  return buffer;
};
