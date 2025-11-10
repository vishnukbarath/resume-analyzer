import React, { useState } from "react";
import { jdMatch } from "../api";

export default function JDMatcher() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [out, setOut] = useState(null);

  async function run() {
    const data = await jdMatch(jd, null, resume);
    setOut(data);
  }

  return (
    <div>
      <h2>JD — Resume Match</h2>
      <textarea rows={6} placeholder="Paste job description" value={jd} onChange={e=>setJd(e.target.value)} />
      <textarea rows={8} placeholder="Paste resume text" value={resume} onChange={e=>setResume(e.target.value)} />
      <div><button onClick={run}>Run Match</button></div>

      {out && (
        <div className="card">
          <h3>Match Score: {out.matchScore}%</h3>
          <h4>Top JD keywords</h4>
          <p>{out.jdKeywords?.join(", ")}</p>
          <h4>Present</h4><p>{out.present?.join(", ")}</p>
          <h4>Missing</h4><p>{out.missing?.join(", ")}</p>
          <h4>LLM Explanation</h4>
          <pre>{out.llm}</pre>
        </div>
      )}
    </div>
  );
}
