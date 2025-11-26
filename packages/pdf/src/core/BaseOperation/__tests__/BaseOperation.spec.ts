import { describe, it, expect } from 'vitest';
import { BaseOperation } from '..';
import type {
  InsertTextEdit,
  DeleteTextEdit,
  ReplaceTextEdit,
  HighlightEdit,
  AddStickyNoteEdit,
  FreeTextEdit,
  RedactionEdit,
  PdfEdit,
} from '@types';
import { PDFDocument } from 'pdf-lib';

// Minimal concrete subclass of BaseOperation using a real PdfEdit type
class DummyInsertTextOperation extends BaseOperation<InsertTextEdit> {
  static operationType = 'insert-text';

  constructor(arg: SerializableEdit<InsertTextEdit>);
  constructor(arg: InsertTextEdit);
  constructor(arg: SerializableEdit<InsertTextEdit> | InsertTextEdit) {
    super(arg as SerializableEdit<InsertTextEdit>);
  }

  // noop for testing serialize
  async applyEdit(pdfDoc: PDFDocument) {
    return this;
  }
}

// Create a generic test operation for any PdfEdit type
class TestOperation<T extends PdfEdit> extends BaseOperation<T> {
  async applyEdit(pdfDoc: PDFDocument) {
    return this;
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

  describe('isPageLevel()', () => {
    it('returns true for insert-text edit', () => {
      const edit: InsertTextEdit = {
        type: 'insert-text',
        page: 0,
        value: 'test',
        position: { x: 0, y: 0 },
      };
      const op = new TestOperation(edit);
      expect(op.isPageLevel()).toBe(true);
    });

    it('returns true for delete-text edit', () => {
      const edit: DeleteTextEdit = {
        type: 'delete-text',
        page: 0,
        oldValue: 'deleted text',
        position: { x: 0, y: 0 },
      };
      const op = new TestOperation(edit);
      expect(op.isPageLevel()).toBe(true);
    });

    it('returns true for replace-text edit', () => {
      const edit: ReplaceTextEdit = {
        type: 'replace-text',
        page: 0,
        oldValue: 'old',
        newValue: 'new',
        position: { x: 0, y: 0 },
      };
      const op = new TestOperation(edit);
      expect(op.isPageLevel()).toBe(true);
    });

    it('returns true for highlight edit', () => {
      const edit: HighlightEdit = {
        type: 'highlight',
        page: 0,
        rect: { x: 0, y: 0, width: 100, height: 20 },
      };
      const op = new TestOperation(edit);
      expect(op.isPageLevel()).toBe(true);
    });

    it('returns true for add-sticky-note edit', () => {
      const edit: AddStickyNoteEdit = {
        type: 'add-sticky-note',
        page: 0,
        position: { x: 0, y: 0 },
        text: 'note text',
      };
      const op = new TestOperation(edit);
      expect(op.isPageLevel()).toBe(true);
    });

    it('returns true for free-text edit', () => {
      const edit: FreeTextEdit = {
        type: 'free-text',
        page: 0,
        text: 'free text',
        position: { x: 0, y: 0 },
      };
      const op = new TestOperation(edit);
      expect(op.isPageLevel()).toBe(true);
    });

    it('returns true for redact edit', () => {
      const edit: RedactionEdit = {
        type: 'redact',
        page: 0,
        rect: { x: 0, y: 0, width: 100, height: 20 },
      };
      const op = new TestOperation(edit);
      expect(op.isPageLevel()).toBe(true);
    });
  });

  describe('isDocumentLevel()', () => {
    it('returns false for page-level edits', () => {
      const edit: InsertTextEdit = {
        type: 'insert-text',
        page: 0,
        value: 'test',
        position: { x: 0, y: 0 },
      };
      const op = new TestOperation(edit);
      expect(op.isDocumentLevel()).toBe(false);
    });

    it('returns the inverse of isPageLevel()', () => {
      const highlightEdit: HighlightEdit = {
        type: 'highlight',
        page: 0,
        rect: { x: 0, y: 0, width: 100, height: 20 },
      };
      const op = new TestOperation(highlightEdit);
      expect(op.isDocumentLevel()).toBe(!op.isPageLevel());
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
