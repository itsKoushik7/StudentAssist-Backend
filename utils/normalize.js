const natural = require("natural");
const sw = require("stopword");

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

function normalizeQuestion(text) {
  text = text.toLowerCase();

  let tokens = tokenizer.tokenize(text);

  tokens = sw.removeStopwords(tokens);

  tokens = tokens.map((token) => stemmer.stem(token));

  return tokens.join(" ");
}

module.exports = { normalizeQuestion };
