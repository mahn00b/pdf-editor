import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { ReplaceTextOperation } from '..';
import type { ReplaceTextEdit } from '../../../types';

describe('ReplaceTextOperation', () => {
  it('applies a replace-text operation to a PDF page', async () => {
    // Create a new PDF with one page
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();

    const edit: ReplaceTextEdit = {
      type: 'replace-text',
      page: 0,
      oldValue: 'Old text',
      newValue: 'New text',
      position: { x: 100, y: 700 },
      font: { size: 18 },
    };

    const op = new ReplaceTextOperation(edit);
    await op.apply(pdfDoc);

    // Serialize and reload to ensure valid PDF output
    const pdfBytes = await pdfDoc.save();
    const reloaded = await PDFDocument.load(pdfBytes);

    expect(reloaded.getPageCount()).toBe(1);
  });

  it('assigns unique ids and timestamps per operation', () => {
    const edit: ReplaceTextEdit = {
      type: 'replace-text',
      page: 0,
      oldValue: 'One',
      newValue: 'Two',
      position: { x: 50, y: 600 },
    };

    const op1 = new ReplaceTextOperation(edit);
    const op2 = new ReplaceTextOperation(edit);

    expect(op1.id).not.toBe(op2.id);
    expect(op1.timestamp).toBeTypeOf('number');
  });

  it('serialize() returns a valid SerializableEdit', () => {
    const edit: ReplaceTextEdit = {
      type: 'replace-text',
      page: 0,
      oldValue: 'foo',
      newValue: 'bar',
      position: { x: 20, y: 400 },
      font: { size: 12 },
    };

    const op = new ReplaceTextOperation(edit);
    const serialized = op.serialize();

    expect(serialized).toEqual({
      id: op.id,
      type: 'replace-text',
      timestamp: op.timestamp,
      edit,
    });
  });
});