// utils/groq/generateQuestions.js
const axios = require("axios");

async function generateQuestions(experienceLevel, role, technology) {
  const prompt = `Generate 30 interview questions for a ${experienceLevel} ${role} with focus on ${technology}. Number them 1 to 30.`;

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const text = response.data.choices[0].message.content;

  const questions = text
    .split("\n")
    .filter((line) => line.trim())
    .map((q) => q.replace(/^\d+\.\s*/, "").trim());

  return questions;
}

module.exports = generateQuestions;
