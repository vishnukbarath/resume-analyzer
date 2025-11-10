import React, { useState } from "react";
import { multiRank } from "../api";

export default function MultiRank() {
  const [files, setFiles] = useState([]);
  const [out, setOut] = useState(null);

  async function run() {
    if (!files.length) return alert("Select files");
    const data = await multiRank(files);
    setOut(data);
  }

  return (
    <div>
      <h2>Multi Resume Ranking</h2>
      <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files))} />
      <button onClick={run}>Upload & Rank</button>
      {out && (
        <div className="card">
          <h3>Ranked Results</h3>
          <ol>
            {out.results.map(r => <li key={r.filename}><strong>{r.filename}</strong> — ATS {r.atsScore} <br/> {r.summary}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
