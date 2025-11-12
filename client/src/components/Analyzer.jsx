import React, { useState } from "react";
import { analyzeText, analyzeFile } from "../api";

export default function Analyzer() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function onAnalyze() {
    if (!text.trim() && !file) {
      setError("Please provide either resume text or upload a file");
      return;
    }

    setLoading(true);
    setError(null);
    setRes(null);
    
    try {
      let data;
      if (file) {
        data = await analyzeFile(file);
      } else {
        data = await analyzeText(text);
      }
      
      if (data.error) {
        setError(data.error);
      } else {
        setRes(data);
      }
    } catch(e) {
      console.error("Analysis error:", e);
      console.error("Error response:", e.response);
      
      let errorMessage = "Analysis failed. ";
      
      if (e.response) {
        // Server responded with error
        errorMessage += e.response.data?.error || e.response.statusText || `Server error (${e.response.status})`;
        if (e.response.data?.details) {
          errorMessage += `: ${e.response.data.details}`;
        }
      } else if (e.request) {
        // Request was made but no response received
        errorMessage += "No response from server. Please ensure the server is running on port 5000.";
      } else {
        // Error in request setup
        errorMessage += e.message || "Unknown error occurred.";
      }
      
      setError(errorMessage);
    } finally { 
      setLoading(false); 
    }
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setText(""); // Clear text when file is selected
    }
  }

  return (
    <div>
      <h2>Analyze Resume</h2>
      
      <div style={{marginBottom: "16px"}}>
        <label>
          <strong>Upload Resume File (PDF/DOCX):</strong>
          <input 
            type="file" 
            accept=".pdf,.docx,.doc" 
            onChange={handleFileChange}
            style={{marginLeft: "8px"}}
            disabled={loading}
          />
        </label>
        {file && <p style={{color: "green", marginTop: "4px"}}>Selected: {file.name}</p>}
      </div>

      <div style={{marginBottom: "8px"}}>
        <strong>OR Paste Resume Text:</strong>
      </div>
      <textarea 
        rows={12} 
        value={text} 
        onChange={e=>{
          setText(e.target.value);
          if (e.target.value) setFile(null); // Clear file when text is entered
        }} 
        placeholder="Paste resume text here" 
        disabled={loading || !!file}
      />
      
      <div style={{marginTop:8}}>
        <button onClick={onAnalyze} disabled={loading || (!text.trim() && !file)}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && (
        <div style={{marginTop: "16px", padding: "12px", backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: "4px"}}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {res && (
        <div className="card" style={{marginTop: "16px"}}>
          <h3>Overall Score: {res.overall_score || 'N/A'} — ATS Score: {res.ats_score || 'N/A'}</h3>
          <p><strong>Summary:</strong> {res.summary || 'No summary available'}</p>
          <div style={{display:"flex", gap:20, marginTop: "16px"}}>
            <div>
              <h4>Strengths</h4>
              <ul>{res.strengths && res.strengths.length > 0 ? res.strengths.map((s,i)=><li key={i}>{s}</li>) : <li>None listed</li>}</ul>
            </div>
            <div>
              <h4>Weaknesses</h4>
              <ul>{res.weaknesses && res.weaknesses.length > 0 ? res.weaknesses.map((s,i)=><li key={i}>{s}</li>) : <li>None listed</li>}</ul>
            </div>
          </div>
          <h4 style={{marginTop: "16px"}}>Suggestions</h4>
          <ul>{res.suggestions && res.suggestions.length > 0 ? res.suggestions.map((s,i)=><li key={i}>{s}</li>) : <li>No suggestions available</li>}</ul>
          
          {res.missing_important_keywords && res.missing_important_keywords.length > 0 && (
            <>
              <h4 style={{marginTop: "16px"}}>Missing Important Keywords</h4>
              <ul>{res.missing_important_keywords.map((k,i)=><li key={i}>{k}</li>)}</ul>
            </>
          )}
          
          {res.best_fit_roles && res.best_fit_roles.length > 0 && (
            <>
              <h4 style={{marginTop: "16px"}}>Best Fit Roles</h4>
              <ul>{res.best_fit_roles.map((r,i)=><li key={i}>{r}</li>)}</ul>
            </>
          )}
          
          {res.estimated_salary_range && (
            <p style={{marginTop: "16px"}}><strong>Estimated Salary Range:</strong> {res.estimated_salary_range}</p>
          )}
        </div>
      )}
    </div>
  );
}
