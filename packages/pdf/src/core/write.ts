import type { PDFDocument } from "pdf-lib";

export async function savePDF(document: PDFDocument): Promise<Uint8Array> {
  try {
    const pdfBytes = await document.save();
    return pdfBytes;
  } catch (error) {
    console.error("Error writing PDF:", error);
    throw error;
  }
}
