import { describe, it, expect, beforeAll } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { readPDF, savePDF } from '..';

describe('PDF Core (browser-compatible Node tests)', () => {
  let samplePdfBytes: Uint8Array;

  beforeAll(async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    samplePdfBytes = await pdfDoc.save();
  });

  it('should load PDF from ArrayBuffer', async () => {
    const arrayBuffer = samplePdfBytes.buffer.slice(
      samplePdfBytes.byteOffset,
      samplePdfBytes.byteOffset + samplePdfBytes.byteLength
    );
    const pdfDoc = await readPDF(arrayBuffer as ArrayBuffer);
    expect(pdfDoc.getPageCount()).toBe(1);
  });

  it('should save PDF and return Uint8Array', async () => {
    const pdfDoc = await readPDF(samplePdfBytes.buffer as ArrayBuffer);
    const bytes = await savePDF(pdfDoc);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('should throw on invalid input', async () => {
    // @ts-ignore
    await expect(readPDF(123)).rejects.toThrow('Unsupported input type for readPDF');
  });
});