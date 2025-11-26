import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PdfDoc } from '..';
import { PDFDocument } from 'pdf-lib';

// Import operations to reference their mocks
import { DeleteTextOperation } from '@ops/operations/DeleteText';
import { HighlightOperation } from '@ops/operations/Highlight';
import { InsertTextOperation } from '@ops/operations/InsertText';
import { ReplaceTextOperation } from '@ops/operations/ReplaceText';
import { AddStickyNoteOperation } from '@ops/operations/StickyNote';
import { FreeTextOperation } from '@ops/operations/FreeText';
import { RedactionOperation } from '@ops/operations/Redaction';

// Import types for proper type checking
import type {
  SerializableEdit,
  PdfEdit,
  InsertTextEdit,
  DeleteTextEdit,
  ReplaceTextEdit,
  HighlightEdit,
  AddStickyNoteEdit,
  FreeTextEdit,
  RedactionEdit
} from '@types';

// Shared spy for all operations, hoisted so it's available in mocks
const { mockApplyEdit } = vi.hoisted(() => ({
  mockApplyEdit: vi.fn()
}));

function createMockOp(name: string) {
  const MockOp = vi.fn().mockImplementation(function(this: any, edit: any) {
    this.edit = edit;
    this.applyEdit = vi.fn().mockImplementation(async () => {
      await mockApplyEdit();
      return this;
    });
    this.serialize = vi.fn().mockReturnValue({ ...edit, id: 'mock-id' });
  });
  (MockOp as any).mockApplyEdit = mockApplyEdit;
  return { [name]: MockOp };
}

vi.mock('@ops/operations/DeleteText', () => createMockOp('DeleteTextOperation'));
vi.mock('@ops/operations/Highlight', () => createMockOp('HighlightOperation'));
vi.mock('@ops/operations/InsertText', () => createMockOp('InsertTextOperation'));
vi.mock('@ops/operations/ReplaceText', () => createMockOp('ReplaceTextOperation'));
vi.mock('@ops/operations/StickyNote', () => createMockOp('AddStickyNoteOperation'));
vi.mock('@ops/operations/FreeText', () => createMockOp('FreeTextOperation'));
vi.mock('@ops/operations/Redaction', () => createMockOp('RedactionOperation'));

vi.mock('@query/queries/FindText', () => ({
  findText: vi.fn().mockResolvedValue([{ page: 0, text: 'Hello World', position: { x: 100, y: 200 } }]),
}));

describe('PdfDoc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load a PDF', async () => {
    const loadSpy = vi.spyOn(PDFDocument, 'load').mockResolvedValue({
      save: vi.fn().mockResolvedValue(new Uint8Array()),
    } as any);

    const doc = await PdfDoc.load(new Uint8Array());
    expect(doc).toBeDefined();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should delegate insertText to InsertTextOperation', async () => {
    const doc = await PdfDoc.load(new Uint8Array());
    const edit = { id: '1', type: 'insert-text' } as any;

    await doc.insertText(edit);

    // Check if the operation class was instantiated with the edit
    expect(InsertTextOperation).toHaveBeenCalledWith(edit);
    // Check if applyEdit was called (using our static reference)
    expect((InsertTextOperation as any).mockApplyEdit).toHaveBeenCalled();
  });

  it('should delegate deleteText to DeleteTextOperation', async () => {
    const doc = await PdfDoc.load(new Uint8Array());
    const edit = { id: '2', type: 'delete-text' } as any;

    await doc.deleteText(edit);

    expect(DeleteTextOperation).toHaveBeenCalledWith(edit);
    expect((DeleteTextOperation as any).mockApplyEdit).toHaveBeenCalled();
  });

  it('should delegate replaceText to ReplaceTextOperation', async () => {
    const doc = await PdfDoc.load(new Uint8Array());
    const edit = { id: '3', type: 'replace-text' } as any;

    await doc.replaceText(edit);

    expect(ReplaceTextOperation).toHaveBeenCalledWith(edit);
    expect((ReplaceTextOperation as any).mockApplyEdit).toHaveBeenCalled();
  });

  it('should delegate highlight to HighlightOperation', async () => {
    const doc = await PdfDoc.load(new Uint8Array());
    const edit = { id: '4', type: 'highlight' } as any;

    await doc.highlight(edit);

    expect(HighlightOperation).toHaveBeenCalledWith(edit);
    expect((HighlightOperation as any).mockApplyEdit).toHaveBeenCalled();
  });

  it('should delegate stickyNote to StickyNoteOperation', async () => {
    const doc = await PdfDoc.load(new Uint8Array());
    const edit = { id: '5', type: 'sticky-note' } as any;

    await doc.addStickyNote(edit);

    expect(AddStickyNoteOperation).toHaveBeenCalledWith(edit);
    expect((AddStickyNoteOperation as any).mockApplyEdit).toHaveBeenCalled();
  });

  it('should delegate freeText to FreeTextOperation', async () => {
    const doc = await PdfDoc.load(new Uint8Array());
    const edit = { id: '6', type: 'free-text' } as any;

    await doc.freeText(edit);

    expect(FreeTextOperation).toHaveBeenCalledWith(edit);
    expect((FreeTextOperation as any).mockApplyEdit).toHaveBeenCalled();
  });

  it('should delegate redact to RedactionOperation', async () => {
    const doc = await PdfDoc.load(new Uint8Array());
    const edit = { id: '7', type: 'redaction' } as any;

    await doc.redact(edit);

    expect(RedactionOperation).toHaveBeenCalledWith(edit);
    expect((RedactionOperation as any).mockApplyEdit).toHaveBeenCalled();
  });

  it('should return raw data', async () => {
    const initialBytes = new Uint8Array([1, 2, 3]);
    vi.spyOn(PDFDocument, 'load').mockResolvedValue({
      save: vi.fn().mockResolvedValue(new Uint8Array()),
    } as any);

    const doc = await PdfDoc.load(initialBytes);
    expect(doc.getRawData()).toEqual(initialBytes);
  });

  it('should save the document and update raw data', async () => {
    const newBytes = new Uint8Array([4, 5, 6]);
    const mockPdfDoc = {
      save: vi.fn().mockResolvedValue(newBytes),
    };
    vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockPdfDoc as any);

    const doc = await PdfDoc.load(new Uint8Array());
    const savedData = await doc.save();

    expect(mockPdfDoc.save).toHaveBeenCalled();
    expect(savedData).toEqual(newBytes);
    expect(doc.getRawData()).toEqual(newBytes);
  });

  describe('toEditType', () => {
    it('should return InsertTextOperation for insert-text edit type', () => {
      const edit: SerializableEdit<InsertTextEdit> = {
        id: '1',
        type: 'insert-text',
        page: 0,
        timestamp: Date.now(),
        edit: { type: 'insert-text', page: 0, value: 'test', position: { x: 0, y: 0 } }
      };
      const result = PdfDoc.toEditType(edit);
      expect(InsertTextOperation).toHaveBeenCalledWith(edit);
      expect(result).toBeDefined();
    });

    it('should return DeleteTextOperation for delete-text edit type', () => {
      const edit: SerializableEdit<DeleteTextEdit> = {
        id: '2',
        type: 'delete-text',
        page: 0,
        timestamp: Date.now(),
        edit: { type: 'delete-text', page: 0, oldValue: 'test', position: { x: 0, y: 0 } }
      };
      const result = PdfDoc.toEditType(edit);
      expect(DeleteTextOperation).toHaveBeenCalledWith(edit);
      expect(result).toBeDefined();
    });

    it('should return ReplaceTextOperation for replace-text edit type', () => {
      const edit: SerializableEdit<ReplaceTextEdit> = {
        id: '3',
        type: 'replace-text',
        page: 0,
        timestamp: Date.now(),
        edit: { type: 'replace-text', page: 0, oldValue: 'old', newValue: 'new', position: { x: 0, y: 0 } }
      };
      const result = PdfDoc.toEditType(edit);
      expect(ReplaceTextOperation).toHaveBeenCalledWith(edit);
      expect(result).toBeDefined();
    });

    it('should return HighlightOperation for highlight edit type', () => {
      const edit: SerializableEdit<HighlightEdit> = {
        id: '4',
        type: 'highlight',
        page: 0,
        timestamp: Date.now(),
        edit: { type: 'highlight', page: 0, rect: { x: 0, y: 0, width: 100, height: 20 } }
      };
      const result = PdfDoc.toEditType(edit);
      expect(HighlightOperation).toHaveBeenCalledWith(edit);
      expect(result).toBeDefined();
    });

    it('should return AddStickyNoteOperation for add-sticky-note edit type', () => {
      const edit: SerializableEdit<AddStickyNoteEdit> = {
        id: '5',
        type: 'add-sticky-note',
        page: 0,
        timestamp: Date.now(),
        edit: { type: 'add-sticky-note', page: 0, text: 'note', position: { x: 0, y: 0 } }
      };
      const result = PdfDoc.toEditType(edit);
      expect(AddStickyNoteOperation).toHaveBeenCalledWith(edit);
      expect(result).toBeDefined();
    });

    it('should return FreeTextOperation for free-text edit type', () => {
      const edit: SerializableEdit<FreeTextEdit> = {
        id: '6',
        type: 'free-text',
        page: 0,
        timestamp: Date.now(),
        edit: { type: 'free-text', page: 0, text: 'text', position: { x: 0, y: 0 } }
      };
      const result = PdfDoc.toEditType(edit);
      expect(FreeTextOperation).toHaveBeenCalledWith(edit);
      expect(result).toBeDefined();
    });

    it('should return RedactionOperation for redact edit type', () => {
      const edit: SerializableEdit<RedactionEdit> = {
        id: '7',
        type: 'redact',
        page: 0,
        timestamp: Date.now(),
        edit: { type: 'redact', page: 0, rect: { x: 0, y: 0, width: 100, height: 20 } }
      };
      const result = PdfDoc.toEditType(edit);
      expect(RedactionOperation).toHaveBeenCalledWith(edit);
      expect(result).toBeDefined();
    });

    it('should throw an error for unknown edit type', () => {
      const edit = { id: '8', type: 'unknown-type', page: 0, timestamp: Date.now(), edit: {} } as SerializableEdit<PdfEdit>;
      expect(() => PdfDoc.toEditType(edit)).toThrow('Unknown edit type: unknown-type');
    });
  });
});