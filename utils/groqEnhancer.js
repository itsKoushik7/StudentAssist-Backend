const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Clean Groq response text to remove robotic or extra prefixes
function cleanGroqText(text) {
  return text
    .replace(/^\s*(Here (is|are)|Below (is|are)|The following).*\n?/gi, "")
    .replace(/^\s*(Just|Only|Simply).*\n?/gi, "")
    .replace(/^-?\s*(bullet\s*points?|description)\s*:?/gi, "")
    .replace(/^\s*[\r\n]/gm, "") // remove empty lines
    .trim();
}

// Capitalize first letter
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Convert skills object into formatted string
function getSkillText(skillsObj) {
  return Object.entries(skillsObj || {})
    .map(
      ([category, skills]) =>
        `${capitalize(category)}: ${
          Array.isArray(skills) ? skills.join(", ") : skills
        }`
    )
    .join("\n");
}

// Ask Groq with custom prompt
async function askGroq(prompt) {
  const response = await axios.post(
    GROQ_API_URL,
    {
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: "You are a professional resume writer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.choices[0].message.content.trim();
}

// Main enhancer function
exports.enhanceWithGroq = async (data) => {
  const skillText = getSkillText(data.skills);

  const summaryPrompt = `
Generate a human-like, professional 3-4 line resume summary for a candidate based on their name and skills. Avoid repeating the skill list exactly, and instead convey their strengths and learning mindset in a natural way. Use industry-relevant keywords but avoid robotic tone. Just give me Professional Summary, no extra phrases like "Here is..." or "Below is...".

Name: ${data.name}
Skills:
${skillText}
Target Role: ${data?.experience?.[0]?.role || "Software Developer"}
`;

  const rawSummary = data.summary?.trim() || (await askGroq(summaryPrompt));
  const summary = cleanGroqText(rawSummary);

  const enhancedExperiences = await Promise.all(
    (data.experience || []).map(async (exp) => {
      if (!exp.description?.trim()) {
        const descPrompt = `
Write 2 impactful bullet points for this job role for a resume. Use concise, action-driven language with ATS-friendly phrasing. Avoid any extra text like "Here are..." or "Below is...".

Company: ${exp.company}
Role: ${exp.role}
Duration: ${exp.duration}
`;
        exp.description = cleanGroqText(await askGroq(descPrompt));
      }
      return exp;
    })
  );

  return {
    ...data,
    summary,
    experience: enhancedExperiences,
  };
};
