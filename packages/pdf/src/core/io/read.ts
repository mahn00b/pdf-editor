import { PDFDocument } from "pdf-lib";

export async function readPDF(file: ArrayBuffer | Uint8Array) {
  try {
    return await PDFDocument.load(file);
  } catch (error) {
    console.error("Error reading PDF:", error);
    throw new Error("Unsupported input type for readPDF");
  }
}