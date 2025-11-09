import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import fs from "fs";
import { parseFile } from "./parser.js";
import { callGemini } from "./gemini.js";
import { simpleKeywordMatch, atsScoreFromFeatures, extractBasicFeatures } from "./helpers.js";
import dotenv from "dotenv";
dotenv.config();

const upload = multer({ dest: "uploads/" });
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// --------------------------------------------------
// Utility: parse uploaded file, or plain text
// --------------------------------------------------
async function getTextFromUpload(file) {
  if (!file) return "";
  const text = await parseFile(file.path, file.mimetype);
  // cleanup
  try { fs.unlinkSync(file.path); } catch(e){}
  return text;
}

// --------------------------------------------------
// Analyze resume: main endpoint returns JSON object
// --------------------------------------------------
app.post("/api/analyze", upload.single("file"), async (req, res) => {
  try {
    const resumeText = req.body.text || (req.file ? await getTextFromUpload(req.file) : "");
    if (!resumeText || resumeText.trim().length < 10) return res.status(400).json({ error: "No resume provided" });

    // basic features
    const features = extractBasicFeatures(resumeText);
    const atsScore = atsScoreFromFeatures(features);

    // ask LLM for structured analysis
    const prompt = `
You are a resume evaluation expert. Given the resume text below, respond in JSON EXACTLY with fields:
{
  "overall_score": number 0-100,
  "summary": "short summary",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "missing_important_keywords": ["..."],
  "suggestions": ["..."],
  "best_fit_roles": ["..."],
  "estimated_salary_range": "string"
}
Resume:
${resumeText}
Use ATS heuristics and suggest skills/keywords missing for mid-level software engineering roles.
Limit arrays to top 8 items each.
    `;
    const llm = await callGemini(prompt, { max_tokens: 800 });
    let llmJson = {};
    try {
      // try to parse JSON from LLM response
      const jsonStart = llm.text.indexOf("{");
      const jsonText = jsonStart >= 0 ? llm.text.slice(jsonStart) : llm.text;
      llmJson = JSON.parse(jsonText);
    } catch (e) {
      // fallback: put LLM plain text into summary
      console.warn("LLM JSON parse failed, using fallback");
      llmJson = {
        overall_score: Math.round((atsScore + 70)/2),
        summary: llm.text.slice(0, 800),
        strengths: [],
        weaknesses: [],
        missing_important_keywords: [],
        suggestions: [],
        best_fit_roles: [],
        estimated_salary_range: ""
      };
    }

    // combine ATS score (exposed separately)
    const result = { ...llmJson, ats_score: atsScore, features };
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "analysis error" });
  }
});

// --------------------------------------------------
// JD - Resume match endpoint
// --------------------------------------------------
app.post("/api/jd-match", upload.single("resume"), async (req, res) => {
  try {
    const jdText = req.body.jd || "";
    if (!jdText || jdText.trim().length < 5) return res.status(400).json({ error: "JD text required" });

    const resumeText = req.body.text || (req.file ? await getTextFromUpload(req.file) : "");
    if (!resumeText) return res.status(400).json({ error: "Resume required" });

    const { jdKeywords, present, missing, matchScore } = simpleKeywordMatch(resumeText, jdText, 20);

    // optionally call LLM to explain match and list what to add
    const prompt = `Given this job description keywords: ${jdKeywords.join(", ")} and resume excerpt, explain the match and suggest 6 improvements to raise match score. Resume excerpt: ${resumeText.slice(0,2000)}`;
    const llm = await callGemini(prompt, { max_tokens: 500 });

    res.json({ matchScore, jdKeywords, present, missing, llm: llm.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "jd-match error" });
  }
});

// --------------------------------------------------
// Rewriter - rewrite resume to be ATS-friendly
// --------------------------------------------------
app.post("/api/rewriter", upload.single("file"), async (req, res) => {
  try {
    const resumeText = req.body.text || (req.file ? await getTextFromUpload(req.file) : "");
    const targetRole = req.body.role || "Software Engineer";

    if (!resumeText) return res.status(400).json({ error: "Resume required" });

    const prompt = `
Rewrite the resume below to be ATS-friendly and concise for role: ${targetRole}.
Return only the rewritten resume text. Keep bullet points, strong action verbs, quantify achievements where possible, and preserve technical skills in a skills section.
Original Resume:
${resumeText}
    `;
    const llm = await callGemini(prompt, { max_tokens: 1200 });
    res.json({ rewritten: llm.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "rewriter error" });
  }
});

// --------------------------------------------------
// Skill extractor
// --------------------------------------------------
app.post("/api/extract-skills", upload.single("file"), async (req, res) => {
  try {
    const resumeText = req.body.text || (req.file ? await getTextFromUpload(req.file) : "");
    if (!resumeText) return res.status(400).json({ error: "Resume required" });

    const prompt = `
Extract skills from the resume as JSON:
{
  "hard_skills": [...],
  "soft_skills": [...],
  "tools": [...],
  "certifications": [...]
}
Resume:
${resumeText}
Limit lists to top 30.
    `;
    const llm = await callGemini(prompt, { max_tokens: 500 });
    let data = {};
    try { data = JSON.parse(llm.text.slice(llm.text.indexOf("{"))); } catch(e) { data = { hard_skills: [], soft_skills: [], tools: [], certifications: [] }; }
    res.json({ ...data, raw: llm.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "extract error" });
  }
});

// --------------------------------------------------
// Cover letter generator
// --------------------------------------------------
app.post("/api/cover-letter", async (req, res) => {
  try {
    const { jd, resume } = req.body;
    if (!jd || !resume) return res.status(400).json({ error: "JD and resume required" });

    const prompt = `
Generate a one-page professional cover letter tailored to this job description and candidate resume. Keep it formal, mention 2-3 key accomplishments from resume and tie to JD requirements. Output only the letter.
Job Description:
${jd}
Resume:
${resume}
    `;
    const llm = await callGemini(prompt, { max_tokens: 600 });
    res.json({ letter: llm.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "cover letter error" });
  }
});

// --------------------------------------------------
// Multi-resume ranking: accepts multiple file uploads (name files 'files')
// --------------------------------------------------
app.post("/api/multi-rank", upload.array("files", 50), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: "No files uploaded" });

    // parse each file and call /api/analyze logic inline (lighter weight)
    const results = [];
    for (const f of files) {
      const txt = await getTextFromUpload(f);
      const features = extractBasicFeatures(txt);
      const atsScore = atsScoreFromFeatures(features);

      // short LLM summary for ranking (optional)
      const prompt = `Summarize this resume in one short sentence and suggest best-fit role. Resume: ${txt.slice(0,2000)}`;
      let llmText = "";
      try {
        const llm = await callGemini(prompt, { max_tokens: 200 });
        llmText = llm.text;
      } catch(e) { llmText = ""; }

      results.push({ filename: f.originalname, atsScore, summary: llmText });
    }

    // rank by atsScore desc
    results.sort((a,b)=>b.atsScore - a.atsScore);
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "multi-rank error" });
  }
});

// --------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
