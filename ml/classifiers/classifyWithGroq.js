const axios = require("axios");

async function classifyUnitWithGroq(questionText, unitDescriptions) {
  const prompt = `
Classify the following question into one of the syllabus units below.

Question:
"${questionText}"

Syllabus Units:
${Object.entries(unitDescriptions)
  .map(([num, desc]) => `${num}. ${desc}`)
  .join("\n")}

Which unit (1 to 5) does this question belong to? Reply with only the unit number.
`;

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      }
    );

    const content = res.data.choices[0].message.content.trim();
    const match = content.match(/\b[1-5]\b/);
    return match ? parseInt(match[0]) : null;
  } catch (err) {
    console.error("❌ Groq classification error:", err.message);
    return null;
  }
}

module.exports = { classifyUnitWithGroq };
