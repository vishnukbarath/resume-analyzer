// wrapper for Gemini / LLM calls
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function callGemini(prompt, opts = {}) {
  // Replace with actual Gemini API integration.
  // This function returns { text: string }.
  // If you have @google/generative-ai client, swap implementation here.

  if (!GEMINI_API_KEY) {
    // fallback simple heuristic: echo prompt truncated for offline testing
    return { text: `[[STUB RESULT — GEMINI KEY MISSING]]\nPrompt (truncated): ${prompt.slice(0, 800)}` };
  }

  // Example using a hypothetical REST endpoint — adapt to your real client library.
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions", // replace with Gemini endpoint if needed
      {
        model: "gpt-4o-mini", // swap with actual model id or gemini model
        messages: [{ role: "user", content: prompt }],
        max_tokens: opts.max_tokens || 800
      },
      {
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const text = res.data?.choices?.[0]?.message?.content || JSON.stringify(res.data);
    return { text };
  } catch (err) {
    console.error("LLM call failed:", err.response?.data || err.message);
    throw new Error("LLM call failed");
  }
}

export { callGemini };
