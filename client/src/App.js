import React, { useState } from "react";
import Analyzer from "./components/Analyzer";
import JDMatcher from "./components/JDMatcher";
import Rewriter from "./components/Rewriter";
import SkillExtractor from "./components/SkillExtractor";
import RadarChartPage from "./components/RadarChartPage";
import MultiRank from "./components/MultiRank";
import CoverLetter from "./components/CoverLetter";

export default function App() {
  const [page, setPage] = useState("analyze");
  return (
    <div className="container">
      <header>
        <h1>AI Resume Analyzer</h1>
        <nav>
          <button onClick={()=>setPage("analyze")}>Analyze</button>
          <button onClick={()=>setPage("jd")}>JD Match</button>
          <button onClick={()=>setPage("rewriter")}>Rewriter</button>
          <button onClick={()=>setPage("skills")}>Extract Skills</button>
          <button onClick={()=>setPage("radar")}>Radar Chart</button>
          <button onClick={()=>setPage("multirank")}>Multi-Rank</button>
          <button onClick={()=>setPage("cover")}>Cover Letter</button>
        </nav>
      </header>

      <main>
        {page === "analyze" && <Analyzer/>}
        {page === "jd" && <JDMatcher/>}
        {page === "rewriter" && <Rewriter/>}
        {page === "skills" && <SkillExtractor/>}
        {page === "radar" && <RadarChartPage/>}
        {page === "multirank" && <MultiRank/>}
        {page === "cover" && <CoverLetter/>}
      </main>
    </div>
  );
}
