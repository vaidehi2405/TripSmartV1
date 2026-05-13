import { NextResponse } from "next/server";

import { groq } from "@/lib/groq";

export async function GET() {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "say hello" }],
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({
      model: completion.model,
      message: text,
      usage: completion.usage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
