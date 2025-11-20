import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { HighlightOperation } from '../';
import type { HighlightEdit } from '../../../types';

describe('HighlightOperation', () => {
  it('applies a highlight overlay to the correct page', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();

    const edit: HighlightEdit = {
      type: 'highlight',
      page: 0,
      rect: { x: 100, y: 500, width: 200, height: 20 },
      color: { r: 1, g: 1, b: 0 }, // yellow
    };

    const op = new HighlightOperation(edit);
    await op.apply(pdfDoc);

    const pdfBytes = await pdfDoc.save();
    const reloaded = await PDFDocument.load(pdfBytes);

    expect(reloaded.getPageCount()).toBe(1);
  });

  it('serializes correctly', () => {
    const edit: HighlightEdit = {
      type: 'highlight',
      page: 0,
      rect: { x: 50, y: 100, width: 100, height: 15 },
      color: { r: 0.8, g: 0.2, b: 0.2 },
    };

    const op = new HighlightOperation(edit);
    const serialized = op.serialize();

    expect(serialized.type).toBe('highlight');
    expect(serialized.edit.color).toEqual({ r: 0.8, g: 0.2, b: 0.2 });
  });
});
