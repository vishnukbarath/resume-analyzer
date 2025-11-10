import axios from "axios";
const BASE = "http://localhost:5000/api";

export async function analyzeFile(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(`${BASE.replace('/api','')}/analyze`, form, { headers: {'Content-Type': 'multipart/form-data'}});
  return res.data;
}

export async function analyzeText(text) {
  const res = await axios.post(`${BASE.replace('/api','')}/analyze`, { text });
  return res.data;
}

export async function jdMatch(jd, file, text) {
  const form = new FormData();
  if (file) form.append("resume", file);
  form.append("jd", jd);
  form.append("text", text || "");
  const res = await axios.post(`${BASE.replace('/api','')}/jd-match`, form, { headers: {'Content-Type': 'multipart/form-data'}});
  return res.data;
}

export async function rewriter(textOrFile, role) {
  const form = new FormData();
  if (textOrFile instanceof File) form.append("file", textOrFile);
  else form.append("text", textOrFile);
  form.append("role", role || "");
  const res = await axios.post(`${BASE.replace('/api','')}/rewriter`, form, { headers: {'Content-Type': 'multipart/form-data'}});
  return res.data;
}

export async function extractSkills(textOrFile) {
  const form = new FormData();
  if (textOrFile instanceof File) form.append("file", textOrFile);
  else form.append("text", textOrFile);
  const res = await axios.post(`${BASE.replace('/api','')}/extract-skills`, form, { headers: {'Content-Type': 'multipart/form-data'}});
  return res.data;
}

export async function coverLetter(jd, resumeText) {
  const res = await axios.post(`${BASE.replace('/api','')}/cover-letter`, { jd, resume: resumeText });
  return res.data;
}

export async function multiRank(files) {
  const form = new FormData();
  files.forEach(f => form.append("files", f));
  const res = await axios.post(`${BASE.replace('/api','')}/multi-rank`, form, { headers: {'Content-Type': 'multipart/form-data'}});
  return res.data;
}
