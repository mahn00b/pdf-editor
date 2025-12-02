import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { HighlightOperation } from '../';
import type { HighlightEdit } from '@types';

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
    await op.applyEdit(pdfDoc);

    const pdfBytes = await pdfDoc.save();
    const reloaded = await PDFDocument.load(pdfBytes);

    expect(reloaded.getPageCount()).toBe(1);
  });
});
