const express = require("express");
const router = express.Router();

const { groq } = require("../lib/groq");

router.get("/", async (_req, res) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "say hello" }],
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return res.json({
      model: completion.model,
      message: text,
      usage: completion.usage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

module.exports = router;
