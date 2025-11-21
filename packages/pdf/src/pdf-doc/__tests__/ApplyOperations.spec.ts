import { describe, it, expect, beforeEach } from 'vitest'
import { PdfDoc } from '..';
import { PDFDocument } from 'pdf-lib';
import type { SerializableEdit, InsertTextEdit, HighlightEdit } from '@types';

describe('PdfDoc.applyOperations', () => {
  let pdfDoc: PdfDoc;

  beforeEach(async () => {
    // Create a valid minimal PDF
    const doc = await PDFDocument.create();
    doc.addPage([600, 400]);
    const pdfBytes = await doc.save();
    pdfDoc = await PdfDoc.load(pdfBytes);
  });

  it('applies a single InsertText edit', async () => {
    const insertEdit: SerializableEdit<InsertTextEdit> = {
      id: '1',
      type: 'insert-text',
      page: 0,
      timestamp: Date.now(),
      edit: {
        type: 'insert-text',
        page: 0,
        value: 'Hello World',
        position: { x: 50, y: 50 },
      },
    };

    await pdfDoc.applyOperations([insertEdit]);

    const results = await pdfDoc.findText('Hello World');
    expect(results.length).toBeGreaterThan(0);
  });

  it('applies multiple edits sequentially', async () => {
    const insertEdit: SerializableEdit<InsertTextEdit> = {
      id: '1',
      type: 'insert-text',
      page: 0,
      timestamp: Date.now(),
      edit: { type: 'insert-text', page: 0, value: 'Hello', position: { x: 10, y: 10 } },
    };

    const highlightEdit: SerializableEdit<HighlightEdit> = {
      id: '2',
      type: 'highlight',
      page: 0,
      timestamp: Date.now(),
      edit: { type: 'highlight', page: 0, rect: { x: 10, y: 10, width: 50, height: 12 } },
    };

    await pdfDoc.applyOperations([insertEdit, highlightEdit]);

    const results = await pdfDoc.findText('Hello');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns the same PdfDoc instance for chaining', async () => {
    const result = await pdfDoc.applyOperations([]);
    expect(result).toBe(pdfDoc);
  });

  it('handles an empty array gracefully', async () => {
    await expect(pdfDoc.applyOperations([])).resolves.toBe(pdfDoc);
  });

  it('throws an error for unknown edit types', async () => {
    const badEdit: SerializableEdit<any> = {
      id: 'bad',
      type: 'unknown',
      page: 0,
      timestamp: Date.now(),
      edit: { type: 'unknown', page: 0 },
    };

    await expect(pdfDoc.applyOperations([badEdit])).rejects.toThrow('Unknown edit type');
  });
});
