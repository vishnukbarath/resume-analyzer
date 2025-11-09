// utility helpers: simple ATS heuristics and keyword extraction
function simpleKeywordMatch(resumeText, jdText, topN = 15) {
  // extract words and rank by frequency (very basic)
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const wordCounts = {};
  normalize(jdText).split(/\s+/).forEach(w => {
    if (w.length > 2) wordCounts[w] = (wordCounts[w] || 0) + 1;
  });
  const jdKeywords = Object.entries(wordCounts)
    .sort((a,b)=>b[1]-a[1])
    .slice(0, topN)
    .map(x=>x[0]);

  const resumeNorm = normalize(resumeText);
  const present = jdKeywords.filter(k => resumeNorm.includes(k));
  const missing = jdKeywords.filter(k => !resumeNorm.includes(k));
  const matchScore = Math.round((present.length / jdKeywords.length) * 100);
  return { jdKeywords, present, missing, matchScore };
}

function atsScoreFromFeatures({ wordCount, hasContact, sectionsCount, skillsCount, actionVerbsCount }) {
  // simple heuristic
  let score = 40;
  score += Math.min(20, Math.floor(wordCount / 100));
  score += hasContact ? 10 : -10;
  score += Math.min(15, sectionsCount * 3);
  score += Math.min(15, skillsCount * 2);
  score += Math.min(10, actionVerbsCount);
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return score;
}

function extractBasicFeatures(text) {
  const wordCount = (text || "").split(/\s+/).filter(Boolean).length;
  const hasContact = /(@|gmail|phone|tel|linkedin|http)/i.test(text);
  const sectionsMatches = (text.match(/(experience|education|skills|projects|certifications|summary)/gi) || []);
  const sectionsCount = [...new Set(sectionsMatches.map(s => s.toLowerCase()))].length;
  const skillsMatches = (text.match(/(python|java|c\+\+|c#|javascript|react|node|sql|aws|docker|kubernetes|tensorflow|pytorch|git)/gi) || []);
  const skillsCount = [...new Set(skillsMatches.map(s => s.toLowerCase()))].length;
  const actionVerbsCount = (text.match(/\b(led|developed|designed|implemented|optimized|built|created|improved)\b/gi) || []).length;
  return { wordCount, hasContact, sectionsCount, skillsCount, actionVerbsCount };
}

export { simpleKeywordMatch, atsScoreFromFeatures, extractBasicFeatures };
