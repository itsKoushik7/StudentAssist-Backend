const pool = require("../config/db");

async function getUnitDescriptions(subject_code) {
  const [rows] = await pool.query(
    "SELECT unit_number, keyword FROM unit_keywords WHERE subject_code = ?",
    [subject_code]
  );

  const grouped = {};

  for (const row of rows) {
    const unit = row.unit_number;
    if (!grouped[unit]) grouped[unit] = [];
    grouped[unit].push(row.keyword);
  }

  const descriptions = {};
  for (const [unit, keywords] of Object.entries(grouped)) {
    descriptions[unit] = keywords.join(", ");
  }

  return descriptions;
}

module.exports = { getUnitDescriptions };
