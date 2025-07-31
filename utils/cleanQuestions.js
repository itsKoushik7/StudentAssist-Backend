function cleanQuestions(rawQuestions) {
  return rawQuestions.filter((q) => {
    // Remove section headers and notes
    return (
      q.trim().length > 0 &&
      !q.startsWith("**") &&
      !q.startsWith("Here are") &&
      !q.startsWith("Note that")
    );
  });
}

module.exports = { cleanQuestions };
