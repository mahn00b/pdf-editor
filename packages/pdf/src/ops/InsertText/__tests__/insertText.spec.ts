// tests/InsertTextOperation.test.ts
import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { InsertTextOperation } from '..';
import type { InsertTextEdit } from '../../types';

describe('InsertTextOperation', () => {
  it('applies text to a PDF page', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();

    const edit: InsertTextEdit = {
      type: 'insert-text',
      page: 0,
      value: 'Hello, Vitest!',
      position: { x: 50, y: 500 },
      font: { size: 16 },
    };

    const op = new InsertTextOperation(edit);
    await op.apply(pdfDoc);

    const pdfBytes = await pdfDoc.save();
    const loaded = await PDFDocument.load(pdfBytes);

    expect(loaded.getPageCount()).toBe(1);
  });

  it('multiple operations have unique IDs', () => {
    const edit1: InsertTextEdit = { type: 'insert-text', page: 0, value: 'One', position: { x: 0, y: 0 } };
    const edit2: InsertTextEdit = { type: 'insert-text', page: 0, value: 'Two', position: { x: 0, y: 0 } };

    const op1 = new InsertTextOperation(edit1);
    const op2 = new InsertTextOperation(edit2);

    expect(op1.id).not.toBe(op2.id);
  });
});
