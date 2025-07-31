require("dotenv").config();
const axios = require("axios");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Evaluates an answer using Groq API and returns true if score >= 0.6
 * @param {string} question
 * @param {string} userAnswer
 * @param {number} retries
 * @returns {Promise<boolean>}
 */
const evaluateAnswer = async (question, userAnswer, retries = 3) => {
  const prompt = `Evaluate the following:

Question: ${question}
User's Answer: ${userAnswer}

If the user has not attempted or left it blank, return 0.
Otherwise, give a score between 0 (wrong) and 1 (fully correct).
Return ONLY the score as a number.`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const reply = response.data.choices[0].message.content.trim();
      const score = parseFloat(reply);

      if (isNaN(score)) {
        console.warn("⚠️ Invalid score returned:", reply);
        return false;
      }

      return score >= 0.6;
    } catch (err) {
      const isRateLimit =
        err.response?.data?.error?.code === "rate_limit_exceeded";

      if (isRateLimit && attempt < retries) {
        const delay = 1000 + 1000 * attempt;
        console.warn(
          `⚠️ Rate limit hit. Retrying in ${
            delay / 1000
          }s (Attempt ${attempt}/${retries})`
        );
        await sleep(delay);
      } else {
        console.error("❌ Groq evaluation error:", err.message);
        return false;
      }
    }
  }
};

module.exports = { evaluateAnswer };
