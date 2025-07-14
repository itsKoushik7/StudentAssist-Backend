const pool = require("../../config/db");

/**
 * Classify unit based on keywords in DB (unit_keywords table)
 * @param {string} questionText
 * @param {string} subject_code
 * @returns {Promise<number|null>} unit number or null
 */
async function classifyUnitFromDB(questionText, subject_code) {
  const lower = questionText.toLowerCase();

  try {
    const [rows] = await pool.query(
      "SELECT unit_number, keyword FROM unit_keywords WHERE subject_code = ?",
      [subject_code]
    );

    const unitMatchCounts = {};

    for (const row of rows) {
      if (lower.includes(row.keyword.toLowerCase())) {
        unitMatchCounts[row.unit_number] =
          (unitMatchCounts[row.unit_number] || 0) + 1;
      }
    }

    const bestMatch = Object.entries(unitMatchCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];
    return bestMatch ? parseInt(bestMatch[0]) : null;
  } catch (error) {
    console.error("❌ Error in classifyUnitFromDB:", error);
    return null;
  }
}

module.exports = { classifyUnitFromDB };
