import React, { useState } from "react";
import { rewriter } from "../api";

export default function Rewriter() {
  const [text, setText] = useState("");
  const [role, setRole] = useState("Software Engineer");
  const [out, setOut] = useState(null);

  async function run() {
    const data = await rewriter(text, role);
    setOut(data);
  }

  return (
    <div>
      <h2>Auto Resume Rewriter</h2>
      <input value={role} onChange={e=>setRole(e.target.value)} />
      <textarea rows={10} value={text} onChange={e=>setText(e.target.value)} placeholder="Paste resume text" />
      <div><button onClick={run}>Rewrite</button></div>
      {out && <div className="card"><h3>Rewritten Resume</h3><pre>{out.rewritten}</pre></div>}
    </div>
  );
}
