import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in .env file");
} else {
  console.log("✅ GEMINI_API_KEY loaded (length:", GEMINI_API_KEY.length, "characters)");
}

export async function callGemini(prompt, maxTokens = 800) {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found in environment variables");
    return { 
      text: `{
  "overall_score": 65,
  "summary": "API key not configured. Please set GEMINI_API_KEY in your server/.env file.",
  "strengths": ["Resume structure appears complete"],
  "weaknesses": ["Unable to perform AI analysis - API key missing"],
  "missing_important_keywords": [],
  "suggestions": ["Configure GEMINI_API_KEY environment variable in server/.env file"],
  "best_fit_roles": ["Software Engineer"],
  "estimated_salary_range": "N/A"
}`
    };
  }
//update
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    // Correct Gemini API request format
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7
      }
    };

    console.log("Calling Gemini API with prompt length:", prompt.length);
    
    const res = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!text) {
      console.error("Empty response from Gemini API. Response:", JSON.stringify(res.data, null, 2));
      throw new Error("Empty response from Gemini API");
    }

    console.log("Gemini API call successful, response length:", text.length);
    return { text };
    
  } catch (err) {
    console.error("Gemini API call failed:");
    console.error("Error message:", err.message);
    console.error("Error response status:", err.response?.status);
    console.error("Error response data:", JSON.stringify(err.response?.data, null, 2));
    
    let errorMessage = err.message;
    if (err.response?.data?.error) {
      errorMessage = err.response.data.error.message || JSON.stringify(err.response.data.error);
    }
    
    // Provide helpful error messages based on status code
    let userMessage = errorMessage;
    if (err.response?.status === 400) {
      userMessage = "Invalid API request. Check if your GEMINI_API_KEY is correct and valid.";
    } else if (err.response?.status === 401) {
      userMessage = "Unauthorized. Your GEMINI_API_KEY is invalid or expired.";
    } else if (err.response?.status === 403) {
      userMessage = "API access forbidden. Check your API key permissions.";
    } else if (err.response?.status === 429) {
      userMessage = "API rate limit exceeded. Please try again later.";
    }
    
    return {
      text: `{
  "overall_score": 60,
  "summary": "API call failed: ${userMessage}. Status: ${err.response?.status || 'N/A'}. Please check your GEMINI_API_KEY in server/.env file.",
  "strengths": [],
  "weaknesses": ["Unable to connect to AI service"],
  "missing_important_keywords": [],
  "suggestions": ["Verify GEMINI_API_KEY in server/.env file", "Check API key is valid and has proper permissions", "Verify network connection"],
  "best_fit_roles": [],
  "estimated_salary_range": "N/A"
}`
    };
  }
}
