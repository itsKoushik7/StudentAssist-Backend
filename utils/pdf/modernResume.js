const PDFDocument = require("pdfkit");
const getStream = require("get-stream");

function cleanBulletPoints(text) {
  const points = text
    .split(/[\u2022\n]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return points;
}

exports.createModernResume = async (data) => {
  const doc = new PDFDocument({ margin: 40 });
  const stream = doc.pipe(require("stream").PassThrough());

  const PRIMARY_COLOR = "#0a66c2";
  const LIGHT_GREY = "#e0e0e0";

  // Header Section with background
  doc.rect(0, 0, doc.page.width, 100).fill(PRIMARY_COLOR);
  doc
    .fillColor("white")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(data.name, 50, 30, { align: "left" });

  doc
    .fontSize(12)
    .font("Helvetica")
    .text(data.role || "", 50, 60, { align: "left" });

  const contactText = [data.email, data.phone, data.linkedin, data.github]
    .filter(Boolean)
    .join(" | ");
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(contactText, 50, 80, { align: "left" });

  doc.moveDown(2);
  doc.fillColor("black");

  const drawSectionHeader = (title) => {
    doc
      .moveDown(0.8)
      .fontSize(13)
      .fillColor(PRIMARY_COLOR)
      .font("Helvetica-Bold")
      .text(title);
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .strokeColor(LIGHT_GREY)
      .stroke();
    doc.moveDown(0.5);
    doc.fillColor("black");
  };

  // Summary
  if (data.summary) {
    drawSectionHeader("Professional Summary");
    doc.fontSize(10).font("Helvetica").text(data.summary);
  }

  // Skills
  if (data.skills && typeof data.skills === "object") {
    drawSectionHeader("Technical Skills");

    Object.entries(data.skills).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        const label = key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        // Bold the subheading (e.g., Frontend:)
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(`${label}: `, { continued: true });

        // Regular font for skills list
        doc.font("Helvetica").text(value.join(", "));
      }
    });

    doc.moveDown(); // Add some spacing after skills
  }

  // Education
  // if (data.education && data.education.length > 0) {
  //   drawSectionHeader("Education");
  //   data.education.forEach((edu) => {
  //     doc
  //       .fontSize(10)
  //       .font("Helvetica-Bold")
  //       .text(`${edu.school} (${edu.year})`);
  //     doc.font("Helvetica").text(edu.degree);
  //     if (edu.cgpa || edu.percentage) {
  //       doc
  //         .fontSize(9)
  //         .text(
  //           `${edu.cgpa.length() > 0 }  CGPA: ${edu.cgpa || "-"} | Percentage: ${edu.percentage || "-"}`
  //         );
  //     }
  //     doc.moveDown(0.5);
  //   });
  // }
  if (data.education && data.education.length > 0) {
    drawSectionHeader("Education");
    data.education.forEach((edu) => {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`${edu.school} (${edu.year})`);

      doc.font("Helvetica").text(edu.degree);

      // Only print CGPA / Percentage if at least one is present and non-empty
      const parts = [];
      if (edu.cgpa && edu.cgpa.trim().length > 0) {
        parts.push(`CGPA: ${edu.cgpa}`);
      }
      if (edu.percentage && edu.percentage.trim().length > 0) {
        parts.push(`Percentage: ${edu.percentage}`);
      }

      if (parts.length > 0) {
        doc.fontSize(9).text(parts.join(" | "));
      }

      doc.moveDown(0.5);
    });
  }

  // Experience

  const validExperience = data.experience?.filter(
    (exp) =>
      exp.company.trim() !== "" &&
      exp.role.trim() !== "" &&
      exp.duration.trim() !== "" &&
      exp.description.trim() !== ""
  );

  if (validExperience && validExperience.length > 0) {
    drawSectionHeader("Professional Experience");
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

  const validCertifications = data.certifications?.filter(
    (cert) => cert.title.trim() !== ""
  );
  // if (data.certifications?.length > 0) {
  if (validCertifications && validCertifications.length > 0) {
    drawSectionHeader("Certifications");
    data.certifications.forEach((cert) => {
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`• ${cert.title} - ${cert.issuer} (${cert.year})`);
    });
  }

  // Projects
  // const validProjects = data.projects?.filter((proj) => {
  //   proj.title.trim() !== "" && proj.description.trim() !== "";
  // });
  if (data.projects.length > 0) {
    drawSectionHeader("Projects");
    data.projects.forEach((proj) => {
      doc.fontSize(10).font("Helvetica-Bold").text(proj.title);
      if (proj.link) doc.fontSize(9).font("Helvetica-Oblique").text(proj.link);
      doc.fontSize(9).font("Helvetica").text(proj.description);
      doc.moveDown(0.5);
    });
  }

  // Achievements
  if (data.achievements?.length > 0) {
    drawSectionHeader("Achievements");
    doc.fontSize(10).font("Helvetica").list(data.achievements);
  }

  // Languages
  if (data.languages?.length > 0) {
    drawSectionHeader("Languages");
    doc.fontSize(10).font("Helvetica").text(data.languages.join(", "));
  }

  // Hobbies
  if (data.hobbies?.length > 0) {
    drawSectionHeader("Hobbies & Interests");
    doc.fontSize(10).font("Helvetica").text(data.hobbies.join(", "));
  }

  // Location
  if (data.location) {
    drawSectionHeader("Location");
    doc.fontSize(10).font("Helvetica").text(data.location);
  }

  doc.end();
  const buffer = await getStream.buffer(stream);
  return buffer;
};
