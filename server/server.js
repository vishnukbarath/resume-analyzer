import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { callGemini } from "./gemini.js";
import { parseFile, cleanupFile } from "./parser.js";
import { extractFeatures, atsScore, jdKeywordMatch } from "./helpers.js";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

const upload = multer({ dest: uploadsDir });

// Helper: get text from uploaded file
async function getText(file) {
  const text = await parseFile(file.path, file.mimetype);
  cleanupFile(file.path);
  return text;
}

// --------------------
// ROUTES
// --------------------

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Analyze resume
app.post("/api/analyze", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer upload error:", err);
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    }
    next();
  });
}, async (req,res)=>{
  try {
    console.log("Analyze request received:", {
      hasFile: !!req.file,
      hasText: !!req.body.text,
      fileName: req.file?.originalname,
      fileSize: req.file?.size
    });
    
    let resumeText = "";
    
    // Handle file upload
    if (req.file) {
      try {
        console.log("Processing file:", req.file.path, req.file.mimetype);
        resumeText = await getText(req.file);
        console.log("File parsed successfully, text length:", resumeText.length);
        if (!resumeText || !resumeText.trim()) {
          return res.status(400).json({ error: "File appears to be empty or could not be parsed. Please ensure it's a valid PDF or DOCX file." });
        }
      } catch (fileErr) {
        console.error("File parsing error:", fileErr);
        return res.status(400).json({ error: `File parsing failed: ${fileErr.message}` });
      }
    } else if (req.body.text) {
      resumeText = req.body.text;
    }
    
    if(!resumeText || !resumeText.trim()) {
      return res.status(400).json({ error:"Resume text required. Please provide either a file or text." });
    }

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
    
    let llmJson = {};
    try {
      const llm = await callGemini(prompt, 800);
      
      // Try to parse JSON from response
      const jsonStart = llm.text.indexOf("{");
      if (jsonStart === -1) {
        throw new Error("No JSON found in response");
      }
      
      const jsonText = llm.text.slice(jsonStart);
      const jsonEnd = jsonText.lastIndexOf("}");
      if (jsonEnd === -1) {
        throw new Error("Invalid JSON format");
      }
      
      llmJson = JSON.parse(jsonText.slice(0, jsonEnd + 1));
      
      // Validate required fields
      if (typeof llmJson.overall_score !== 'number') {
        llmJson.overall_score = Math.round((ats + 70) / 2);
      }
      if (!Array.isArray(llmJson.strengths)) llmJson.strengths = [];
      if (!Array.isArray(llmJson.weaknesses)) llmJson.weaknesses = [];
      if (!Array.isArray(llmJson.missing_important_keywords)) llmJson.missing_important_keywords = [];
      if (!Array.isArray(llmJson.suggestions)) llmJson.suggestions = [];
      if (!Array.isArray(llmJson.best_fit_roles)) llmJson.best_fit_roles = [];
      if (typeof llmJson.summary !== 'string') llmJson.summary = llm.text.slice(0, 800);
      if (typeof llmJson.estimated_salary_range !== 'string') llmJson.estimated_salary_range = "";
      
    } catch (parseErr) {
      console.error("JSON parsing error:", parseErr);
      // Fallback response
      llmJson = { 
        overall_score: Math.round((ats + 70) / 2), 
        summary: "Unable to parse AI response. Basic analysis completed.", 
        strengths: [], 
        weaknesses: [], 
        missing_important_keywords: [], 
        suggestions: [], 
        best_fit_roles: [], 
        estimated_salary_range: "" 
      };
    }

    console.log("Analysis completed successfully");
    res.json({ ...llmJson, ats_score: ats, features });
  } catch(err) {
    console.error("Analysis error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: "Analysis failed", 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// JD Match
app.post("/api/jd-match", upload.single("file"), async (req,res)=>{
  try {
    const jdText = req.body.jd || "";
    if(!jdText.trim()) return res.status(400).json({ error:"JD required" });

    let resumeText = "";
    if (req.file) {
      try {
        resumeText = await getText(req.file);
      } catch (fileErr) {
        console.error("File parsing error:", fileErr);
        return res.status(400).json({ error: `File parsing failed: ${fileErr.message}` });
      }
    } else if (req.body.text) {
      resumeText = req.body.text;
    }
    
    if(!resumeText.trim()) return res.status(400).json({ error:"Resume required" });

    const { jdKeywords, present, missing, matchScore } = jdKeywordMatch(resumeText, jdText, 20);
    const prompt = `Explain resume vs JD match and suggest 6 improvements. Resume: ${resumeText.slice(0,2000)}`;
    const llm = await callGemini(prompt, 500);

    res.json({ matchScore, jdKeywords, present, missing, llm: llm.text });
  } catch(err){ 
    console.error("JD match error:", err); 
    res.status(500).json({
      error:"JD match failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }); 
  }
});

// Resume Rewriter
app.post("/api/rewriter", upload.single("file"), async (req,res)=>{
  try {
    let resumeText = "";
    if (req.file) {
      try {
        resumeText = await getText(req.file);
      } catch (fileErr) {
        console.error("File parsing error:", fileErr);
        return res.status(400).json({ error: `File parsing failed: ${fileErr.message}` });
      }
    } else if (req.body.text) {
      resumeText = req.body.text;
    }
    
    if(!resumeText.trim()) return res.status(400).json({error:"Resume required"});
    const role = req.body.role || "Software Engineer";

    const prompt = `Rewrite resume for ATS and role: ${role}. Keep bullets, strong verbs, quantify results. Resume: ${resumeText}`;
    const llm = await callGemini(prompt, 1200);
    res.json({ rewritten: llm.text });
  } catch(err){ 
    console.error("Rewriter error:", err); 
    res.status(500).json({
      error:"Rewriter failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }); 
  }
});

// Skill Extractor
app.post("/api/extract-skills", upload.single("file"), async (req,res)=>{
  try {
    let resumeText = "";
    if (req.file) {
      try {
        resumeText = await getText(req.file);
      } catch (fileErr) {
        console.error("File parsing error:", fileErr);
        return res.status(400).json({ error: `File parsing failed: ${fileErr.message}` });
      }
    } else if (req.body.text) {
      resumeText = req.body.text;
    }
    
    if(!resumeText.trim()) return res.status(400).json({error:"Resume required"});

    const prompt = `Extract skills from resume as JSON { "hard_skills":[], "soft_skills":[], "tools":[], "certifications":[] }. Limit 30. Resume: ${resumeText}`;
    const llm = await callGemini(prompt, 500);

    let data = {};
    try { 
      const jsonStart = llm.text.indexOf("{");
      if (jsonStart !== -1) {
        const jsonText = llm.text.slice(jsonStart);
        const jsonEnd = jsonText.lastIndexOf("}");
        if (jsonEnd !== -1) {
          data = JSON.parse(jsonText.slice(0, jsonEnd + 1));
        }
      }
    } catch (parseErr) {
      console.error("JSON parsing error:", parseErr);
    }
    
    // Ensure all required fields exist
    if (!data.hard_skills) data.hard_skills = [];
    if (!data.soft_skills) data.soft_skills = [];
    if (!data.tools) data.tools = [];
    if (!data.certifications) data.certifications = [];
    
    res.json({ ...data, raw: llm.text });
  } catch(err){ 
    console.error("Skill extraction error:", err); 
    res.status(500).json({
      error:"Skill extraction failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }); 
  }
});

// Cover Letter
app.post("/api/cover-letter", async (req,res)=>{
  try {
    const { jd, resume } = req.body;
    if(!jd || !resume) return res.status(400).json({error:"JD and resume required"});

    const prompt = `Generate a professional one-page cover letter using resume and JD. Resume: ${resume} JD: ${jd}`;
    const llm = await callGemini(prompt, 600);
    res.json({ letter: llm.text });
  } catch(err){ 
    console.error("Cover letter error:", err); 
    res.status(500).json({
      error:"Cover letter failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }); 
  }
});

// Multi-Resume Rank
app.post("/api/multi-rank", upload.array("files",50), async (req,res)=>{
  try{
    const files = req.files || [];
    if(!files.length) return res.status(400).json({error:"No files uploaded"});

    const results = [];
    for(const f of files){
      try {
        const txt = await getText(f);
        const features = extractFeatures(txt);
        const ats = atsScore(features);

        const prompt = `Summarize resume and suggest best-fit role. Resume: ${txt.slice(0,2000)}`;
        let summary="";
        try{ summary = (await callGemini(prompt,200)).text; } catch(summaryErr){
          console.error(`Summary generation failed for ${f.originalname}:`, summaryErr);
          summary = "Summary generation failed";
        }
        results.push({ filename: f.originalname, atsScore: ats, summary });
      } catch(fileErr) {
        console.error(`Error processing file ${f.originalname}:`, fileErr);
        results.push({ 
          filename: f.originalname, 
          atsScore: 0, 
          summary: `Error: ${fileErr.message}` 
        });
      }
    }
    results.sort((a,b)=>b.atsScore-a.atsScore);
    res.json({ results });
  }catch(err){ 
    console.error("Multi-rank error:", err); 
    res.status(500).json({
      error:"Multi-rank failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }); 
  }
});

// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
