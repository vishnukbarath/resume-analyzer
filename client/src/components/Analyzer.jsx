import React, { useState } from "react";
import axios from "axios";
import { analyzeText } from "../api";

export default function Analyzer() {
  const [text, setText] = useState("");
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onAnalyze() {
    setLoading(true);
    try {
      const data = await analyzeText(text);
      setRes(data);
    } catch(e) {
      alert("Analysis failed");
    } finally { setLoading(false); }
  }

  return (
    <div>
      <h2>Analyze Resume (paste text)</h2>
      <textarea rows={12} value={text} onChange={e=>setText(e.target.value)} placeholder="Paste resume text here" />
      <div style={{marginTop:8}}>
        <button onClick={onAnalyze} disabled={loading}>Analyze</button>
      </div>

      {res && (
        <div className="card">
          <h3>Overall Score: {res.overall_score} — ATS Score: {res.ats_score}</h3>
          <p><strong>Summary:</strong> {res.summary}</p>
          <div style={{display:"flex", gap:20}}>
            <div>
              <h4>Strengths</h4>
              <ul>{res.strengths?.map((s,i)=><li key={i}>{s}</li>)}</ul>
            </div>
            <div>
              <h4>Weaknesses</h4>
              <ul>{res.weaknesses?.map((s,i)=><li key={i}>{s}</li>)}</ul>
            </div>
          </div>
          <h4>Suggestions</h4>
          <ul>{res.suggestions?.map((s,i)=><li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
