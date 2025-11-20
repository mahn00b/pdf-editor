// tests/DeleteTextOperation.test.ts
import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { DeleteTextOperation } from '..';
import type { DeleteTextEdit } from '../../../types';

describe('DeleteTextOperation', () => {
  it('applies a delete-text operation without throwing', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();

    const edit: DeleteTextEdit = {
      type: 'delete-text',
      page: 0,
      oldValue: 'Goodbye',
      position: { x: 100, y: 700 },
      font: { size: 16 },
    };

    const op = new DeleteTextOperation(edit);
    await op.apply(pdfDoc);

    const bytes = await pdfDoc.save();
    const reloaded = await PDFDocument.load(bytes);

    expect(reloaded.getPageCount()).toBe(1);
  });

  it('assigns unique ids and timestamps per operation', () => {
    const edit: DeleteTextEdit = {
      type: 'delete-text',
      page: 0,
      oldValue: 'foo',
      position: { x: 0, y: 0 },
    };

    const op1 = new DeleteTextOperation(edit);
    const op2 = new DeleteTextOperation(edit);

    expect(op1.id).not.toBe(op2.id);
    expect(op1.timestamp).toBeTypeOf('number');
  });

  it('serialize() returns a valid SerializableEdit', () => {
    const edit: DeleteTextEdit = {
      type: 'delete-text',
      page: 0,
      oldValue: 'erase me',
      position: { x: 10, y: 400 },
    };

    const op = new DeleteTextOperation(edit);
    const serialized = op.serialize();

    expect(serialized).toEqual({
      id: op.id,
      type: 'delete-text',
      page: 0,
      timestamp: op.timestamp,
      edit,
    });
  });
});
