const { enhanceWithGroq } = require("../utils/groqEnhancer");
const { createClassicResume } = require("../utils/pdf/classicResume");

exports.generateResumePDF = async (req, res) => {
  try {
    const userData = req.body;
    console.log("Received body:", req.body);

    // Optionally enhance with Groq
    const enhancedData = await enhanceWithGroq(userData);

    // Generate PDF
    const pdfBuffer = await createClassicResume(enhancedData);

    // Send PDF as response
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="resume.pdf"',
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate resume" });
  }
};
