const Groq = require("groq-sdk");

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing GROQ_API_KEY. Add it to .env (see https://console.groq.com/keys)."
  );
}

const groq = new Groq({ apiKey });

module.exports = { groq };
