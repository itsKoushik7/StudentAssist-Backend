require("dotenv").config();
const axios = require("axios");

async function getAnswerFromGroq(question) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192", // You can try: llama3-70b-8192, mixtral-8x7b-32768, gemma-7b-it
        messages: [
          {
            role: "user",
            content: question,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Groq API Error:", error.response?.data || error.message);
    return "Answer generation failed.";
  }
}

module.exports = { getAnswerFromGroq }; // ✅ Don't forget this!
