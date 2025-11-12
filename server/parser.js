import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function parseFile(filePath, mimeType) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const ext = filePath.split(".").pop().toLowerCase();
  
  try {
    if (ext === "pdf" || mimeType === "application/pdf") {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      if (!data.text || !data.text.trim()) {
        throw new Error("PDF file appears to be empty or could not extract text");
      }
      return data.text;
    }
    if (ext === "docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      if (!result.value || !result.value.trim()) {
        throw new Error("DOCX file appears to be empty or could not extract text");
      }
      return result.value;
    }
    // Try to read as plain text
    const text = fs.readFileSync(filePath, "utf8");
    if (!text || !text.trim()) {
      throw new Error("File appears to be empty");
    }
    return text;
  } catch (err) {
    if (err.message.includes("not found") || err.message.includes("empty")) {
      throw err;
    }
    throw new Error(`Failed to parse file: ${err.message}`);
  }
}

export function cleanupFile(filePath) {
  try { fs.unlinkSync(filePath); } catch {}
}
