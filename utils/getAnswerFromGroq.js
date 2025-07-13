// require("dotenv").config();
// const axios = require("axios");

// const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// async function getAnswerFromGroq(question, retries = 3) {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       const response = await axios.post(
//         "https://api.groq.com/openai/v1/chat/completions",
//         {
//           model: "llama3-8b-8192",
//           messages: [{ role: "user", content: question }],
//           temperature: 0.7,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       return response.data.choices[0].message.content.trim();
//     } catch (error) {
//       const rateLimit =
//         error.response?.data?.error?.code === "rate_limit_exceeded";
//       const delay = 1200; // Wait 1.2s before retry

//       if (rateLimit && attempt < retries) {
//         console.warn(
//           `⚠️ Rate limit hit. Retrying in ${delay}ms (Attempt ${attempt}/${retries})`
//         );
//         await sleep(delay);
//       } else {
//         console.error("Groq API Error:", error.response?.data || error.message);
//         return "Answer generation failed.";
//       }
//     }
//   }
// }

// module.exports = { getAnswerFromGroq };

// ---------------------------------------------------------------------------------------------------

// utils/getAnswerFromGroq.js
require("dotenv").config();
const axios = require("axios");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function getAnswerFromGroq(question, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: question }],
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
      const rateLimit =
        error.response?.data?.error?.code === "rate_limit_exceeded";

      if (rateLimit && attempt < retries) {
        const delay = 1000 + 1000 * attempt; // exponential backoff
        console.warn(
          `⏳ Rate limit hit. Retrying in ${
            delay / 1000
          }s (Attempt ${attempt}/${retries})...`
        );
        await sleep(delay);
      } else {
        console.error("Groq API Error:", error.response?.data || error.message);
        return "Answer generation failed.";
      }
    }
  }
}

module.exports = { getAnswerFromGroq };
