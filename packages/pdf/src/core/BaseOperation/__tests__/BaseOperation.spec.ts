import { describe, it, expect } from 'vitest';
import { BaseOperation } from '..';
import type { InsertTextEdit, SerializableEdit } from '@types';
import { PDFDocument } from 'pdf-lib';

// Minimal concrete subclass of BaseOperation using a real PdfEdit type
class DummyInsertTextOperation extends BaseOperation<InsertTextEdit> {
  static operationType = 'insert-text';

  constructor(arg: SerializableEdit<InsertTextEdit> | InsertTextEdit) {
    super(arg as InsertTextEdit);
  }

  // noop for testing serialize
  async apply(pdfDoc: PDFDocument) {
    return pdfDoc;
  }
}

describe('BaseOperation', () => {
  it('assigns a unique id and timestamp', () => {
    const edit: InsertTextEdit = {
      type: 'insert-text',
      page: 0,
      value: 'test',
      position: { x: 0, y: 0 },
    };

    const op1 = new DummyInsertTextOperation(edit);
    const op2 = new DummyInsertTextOperation(edit);

    expect(op1.id).not.toBe(op2.id);
    expect(op1.timestamp).toBeTypeOf('number');
  });

  it('serialize() returns a correct SerializableEdit', () => {
    const edit: InsertTextEdit = {
      type: 'insert-text',
      page: 0,
      value: 'serialize me',
      position: { x: 0, y: 0 },
    };

    const op = new DummyInsertTextOperation(edit);
    const serialized = op.serialize();

    expect(serialized).toHaveProperty('id', op.id);
    expect(serialized).toHaveProperty('type', 'insert-text');
    expect(serialized).toHaveProperty('timestamp', op.timestamp);
    expect(serialized).toHaveProperty('edit', edit);
  });

  it('preserves id and timestamp when constructed with SerializableEdit', () => {
    const edit: InsertTextEdit = {
      type: 'insert-text',
      page: 0,
      value: 'test',
      position: { x: 0, y: 0 },
    };

    const serialized: SerializableEdit<InsertTextEdit> = {
      id: 'existing-id-123',
      type: 'insert-text',
      page: 0,
      timestamp: 1700000000000,
      edit,
    };

    const op = new DummyInsertTextOperation(serialized);

    expect(op.id).toBe('existing-id-123');
    expect(op.timestamp).toBe(1700000000000);
    expect(op.edit).toEqual(edit);
  });
});
