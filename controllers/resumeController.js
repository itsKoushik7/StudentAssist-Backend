const { enhanceWithGroq } = require("../utils/groqEnhancer");
const { createClassicResume } = require("../utils/pdf/classicResume");
const { createModernResume } = require("../utils/pdf/modernResume");
// const { createMinimalisticResume } = require("../utils/pdf/minimalisticResume");
const { createMinimalisticResume } = require("../utils/pdf/minimalisticResume");

exports.generateResumePDF = async (req, res) => {
  try {
    const userData = req.body;
    console.log("Received body:", userData);

    const template = userData.template || "classic"; // default to 'classic'

    // Step 1: Enhance resume data (summary etc.)
    const enhancedData = await enhanceWithGroq(userData);

    // Step 2: Choose resume generator
    let pdfBuffer;
    if (template === "modern") {
      console.log("Using modern template");
      pdfBuffer = await createModernResume(enhancedData);
    } else if (template === "classic") {
      console.log("Using classic template");
      pdfBuffer = await createClassicResume(enhancedData);
    } else if (template === "minimalistic") {
      console.log("Using minimalistic template");
      pdfBuffer = await createMinimalisticResume(enhancedData);

      // Step 3: Respond with generated PDF
    }
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${template}-resume.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Resume generation failed:", err);
    res.status(500).json({ error: "Failed to generate resume" });
  }
};
