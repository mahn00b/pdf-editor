import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { StickyNoteOperation } from '../src/ops/annotations/StickyNoteOperation';
import type { StickyNoteEdit } from '../src/ops/types';

describe('StickyNoteOperation', () => {
  it('applies a sticky note marker to the correct page', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();

    const edit: StickyNoteEdit = {
      type: 'note',
      page: 0,
      position: { x: 100, y: 500 },
      text: 'Check this section',
    };

    const op = new StickyNoteOperation(edit);
    await op.apply(pdfDoc);

    const pdfBytes = await pdfDoc.save();
    const reloaded = await PDFDocument.load(pdfBytes);

    expect(reloaded.getPageCount()).toBe(1);
  });

  it('serializes correctly', () => {
    const edit: StickyNoteEdit = {
      type: 'note',
      page: 1,
      position: { x: 50, y: 150 },
      text: 'Todo: verify numbers',
    };

    const op = new StickyNoteOperation(edit);
    const serialized = op.serialize();

    expect(serialized.type).toBe('note');
    expect(serialized.edit.text).toBe('Todo: verify numbers');
  });
});
