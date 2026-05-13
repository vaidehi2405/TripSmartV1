import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing GROQ_API_KEY. Add it to .env.local (see https://console.groq.com/keys)."
  );
}

export const groq = new Groq({ apiKey });
