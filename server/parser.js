import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function parseFile(filePath, mimeType) {
  const ext = filePath.split(".").pop().toLowerCase();
  if (ext === "pdf" || mimeType === "application/pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (ext === "docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return fs.readFileSync(filePath, "utf8");
}

export function cleanupFile(filePath) {
  try { fs.unlinkSync(filePath); } catch {}
}
