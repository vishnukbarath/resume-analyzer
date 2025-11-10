import React, { useState } from "react";
import { coverLetter } from "../api";

export default function CoverLetter() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [out, setOut] = useState(null);

  async function run() {
    const data = await coverLetter(jd, resume);
    setOut(data);
  }

  return (
    <div>
      <h2>Cover Letter Generator</h2>
      <textarea rows={6} placeholder="Paste job description" value={jd} onChange={e=>setJd(e.target.value)} />
      <textarea rows={8} placeholder="Paste resume text" value={resume} onChange={e=>setResume(e.target.value)} />
      <div><button onClick={run}>Generate Cover Letter</button></div>
      {out && <div className="card"><pre>{out.letter}</pre></div>}
    </div>
  );
}
