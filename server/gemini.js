import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function callGemini(prompt, maxTokens = 800) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return { text: `[[STUB — GEMINI KEY MISSING]] Prompt: ${prompt.slice(0, 600)}` };

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens
      },
      { headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" } }
    );
    return { text: res.data.choices?.[0]?.message?.content || "" };
  } catch (err) {
    console.error("Gemini API failed:", err.message);
    throw new Error("Gemini API call failed");
  }
}
