// function cleanText(text) {
//   return (
//     text
//       .normalize("NFKD") // Normalize Unicode
//       .replace(/\*\*(.*?)\*\*/g, "$1") // Remove Markdown bold
//       .replace(/[’‘]/g, "'") // Curly apostrophes to plain
//       .replace(/[“”]/g, '"') // Curly quotes to plain
//       .replace(/–|—/g, "-") // Dashes to hyphen
//       .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove ASCII control chars
//       .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width/invisible
//       // Preserve bullets like •, ○, ▪, etc.
//       .replace(/[^\x20-\x7E\n•○▪→\-•·●◦]/g, "") // Keep common bullets
//       .replace(/\s+/g, " ") // Collapse excess whitespace
//       .trim()
//   );
// }

function cleanText(text) {
  return text
    .normalize("NFKD")
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove markdown bold
    .replace(/[’‘]/g, "'") // Normalize apostrophes
    .replace(/[“”]/g, '"') // Normalize quotes
    .replace(/–|—/g, "-") // Normalize dashes
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove ASCII control chars
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width/invisible
    .replace(/[^\x20-\x7E\n•○▪→\-•·●◦]/g, "") // Preserve common bullets
    .replace(/\s+/g, " ") // Collapse excessive whitespace
    .trim();
}

module.exports = { cleanText, formatAnswerForPDF };

function formatAnswerForPDF(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove markdown bold
    .replace(/[^\x20-\x7E\n\r]/g, "") // Remove junk characters
    .replace(/```(.*?)```/gs, "\n$1\n") // Format code blocks
    .replace(/(\r?\n){2,}/g, "\n\n") // Collapse multiple line breaks
    .replace(/^\s*-\s+/gm, "• ") // Convert markdown bullets
    .replace(/(\d+)\.\s+/g, "$1. ") // Numbered list cleanup
    .trim();
}
