import React, { useState } from "react";
import { extractSkills } from "../api";

export default function SkillExtractor() {
  const [text, setText] = useState("");
  const [out, setOut] = useState(null);

  async function run() {
    const data = await extractSkills(text);
    setOut(data);
  }

  return (
    <div>
      <h2>Skill Extractor</h2>
      <textarea rows={8} value={text} onChange={e=>setText(e.target.value)} placeholder="Paste resume text" />
      <div><button onClick={run}>Extract</button></div>
      {out && (
        <div className="card">
          <h4>Hard Skills</h4><p>{out.hard_skills?.join(", ")}</p>
          <h4>Soft Skills</h4><p>{out.soft_skills?.join(", ")}</p>
          <h4>Tools</h4><p>{out.tools?.join(", ")}</p>
          <h4>Certifications</h4><p>{out.certifications?.join(", ")}</p>
        </div>
      )}
    </div>
  );
}
