import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";

import { callGemini } from "./gemini.js";
import { parseFile, cleanupFile } from "./parser.js";
import { extractFeatures, atsScore, jdKeywordMatch } from "./helpers.js";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
const upload = multer({ dest: "uploads/" });

// Helper: get text from uploaded file
async function getText(file) {
  const text = await parseFile(file.path, file.mimetype);
  cleanupFile(file.path);
  return text;
}

// --------------------
// ROUTES
// --------------------

// Analyze resume
app.post("/api/analyze", upload.single("file"), async (req,res)=>{
  try {
    const resumeText = req.body.text || (req.file ? await getText(req.file) : "");
    if(!resumeText.trim()) return res.status(400).json({ error:"Resume text required" });

    const features = extractFeatures(resumeText);
    const ats = atsScore(features);

    const prompt = `
You are a resume expert. Analyze this resume for Software Engineer roles.
Return JSON EXACTLY:
{
  "overall_score": number 0-100,
  "summary": "string",
  "strengths": [],
  "weaknesses": [],
  "missing_important_keywords": [],
  "suggestions": [],
  "best_fit_roles": [],
  "estimated_salary_range": "string"
}
Resume:
${resumeText}
Limit arrays to 8 items each.
    `;
    const llm = await callGemini(prompt, 800);
    let llmJson = {};
    try { llmJson = JSON.parse(llm.text.slice(llm.text.indexOf("{"))); }
    catch { llmJson = { overall_score: Math.round((ats+70)/2), summary: llm.text.slice(0,800), strengths: [], weaknesses: [], missing_important_keywords: [], suggestions: [], best_fit_roles: [], estimated_salary_range: "" }; }

    res.json({ ...llmJson, ats_score: ats, features });
  } catch(err){ console.error(err); res.status(500).json({ error:"Analysis failed" }); }
});

// JD Match
app.post("/api/jd-match", upload.single("file"), async (req,res)=>{
  try {
    const jdText = req.body.jd || "";
    if(!jdText.trim()) return res.status(400).json({ error:"JD required" });

    const resumeText = req.body.text || (req.file ? await getText(req.file) : "");
    if(!resumeText.trim()) return res.status(400).json({ error:"Resume required" });

    const { jdKeywords, present, missing, matchScore } = jdKeywordMatch(resumeText, jdText, 20);
    const prompt = `Explain resume vs JD match and suggest 6 improvements. Resume: ${resumeText.slice(0,2000)}`;
    const llm = await callGemini(prompt, 500);

    res.json({ matchScore, jdKeywords, present, missing, llm: llm.text });
  } catch(err){ console.error(err); res.status(500).json({error:"JD match failed"}); }
});

// Resume Rewriter
app.post("/api/rewriter", upload.single("file"), async (req,res)=>{
  try {
    const resumeText = req.body.text || (req.file ? await getText(req.file) : "");
    if(!resumeText.trim()) return res.status(400).json({error:"Resume required"});
    const role = req.body.role || "Software Engineer";

    const prompt = `Rewrite resume for ATS and role: ${role}. Keep bullets, strong verbs, quantify results. Resume: ${resumeText}`;
    const llm = await callGemini(prompt, 1200);
    res.json({ rewritten: llm.text });
  } catch(err){ console.error(err); res.status(500).json({error:"Rewriter failed"}); }
});

// Skill Extractor
app.post("/api/extract-skills", upload.single("file"), async (req,res)=>{
  try {
    const resumeText = req.body.text || (req.file ? await getText(req.file) : "");
    if(!resumeText.trim()) return res.status(400).json({error:"Resume required"});

    const prompt = `Extract skills from resume as JSON { "hard_skills":[], "soft_skills":[], "tools":[], "certifications":[] }. Limit 30. Resume: ${resumeText}`;
    const llm = await callGemini(prompt, 500);

    let data = {};
    try { data = JSON.parse(llm.text.slice(llm.text.indexOf("{"))); } catch { data = { hard_skills: [], soft_skills: [], tools: [], certifications: [] }; }
    res.json({ ...data, raw: llm.text });
  } catch(err){ console.error(err); res.status(500).json({error:"Skill extraction failed"}); }
});

// Cover Letter
app.post("/api/cover-letter", async (req,res)=>{
  try {
    const { jd, resume } = req.body;
    if(!jd || !resume) return res.status(400).json({error:"JD and resume required"});

    const prompt = `Generate a professional one-page cover letter using resume and JD. Resume: ${resume} JD: ${jd}`;
    const llm = await callGemini(prompt, 600);
    res.json({ letter: llm.text });
  } catch(err){ console.error(err); res.status(500).json({error:"Cover letter failed"}); }
});

// Multi-Resume Rank
app.post("/api/multi-rank", upload.array("files",50), async (req,res)=>{
  try{
    const files = req.files || [];
    if(!files.length) return res.status(400).json({error:"No files uploaded"});

    const results = [];
    for(const f of files){
      const txt = await getText(f);
      const features = extractFeatures(txt);
      const ats = atsScore(features);

      const prompt = `Summarize resume and suggest best-fit role. Resume: ${txt.slice(0,2000)}`;
      let summary="";
      try{ summary = (await callGemini(prompt,200)).text; } catch{}
      results.push({ filename: f.originalname, atsScore: ats, summary });
    }
    results.sort((a,b)=>b.atsScore-a.atsScore);
    res.json({ results });
  }catch(err){ console.error(err); res.status(500).json({error:"Multi-rank failed"}); }
});

// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
