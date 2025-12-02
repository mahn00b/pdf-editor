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
    const edit = { id: '5', type: 'add-sticky-note' } as any;

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

  describe('clone', () => {
    it('should create a new PdfDoc instance with the same data and version', async () => {
      const savedBytes = new Uint8Array([7, 8, 9]);
      const mockPdfDoc = {
        save: vi.fn().mockResolvedValue(savedBytes),
      };
      const loadSpy = vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockPdfDoc as any);

      const doc = await PdfDoc.load(new Uint8Array([1, 2, 3]), 5);
      const clonedDoc = await doc.clone();

      expect(clonedDoc).toBeInstanceOf(PdfDoc);
      expect(clonedDoc).not.toBe(doc);
      expect(clonedDoc.getVersion()).toBe(5);
      // load is called twice: once for original, once for clone
      expect(loadSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('extractPageAsPdf', () => {
    it('should extract a page and return a new PdfDoc', async () => {
      const mockCopiedPage = { type: 'copiedPage' };
      const extractedBytes = new Uint8Array([10, 11, 12]);
      const mockNewPdfDoc = {
        copyPages: vi.fn().mockResolvedValue([mockCopiedPage]),
        addPage: vi.fn(),
        save: vi.fn().mockResolvedValue(extractedBytes),
      };
      const mockSourcePdfDoc = {
        save: vi.fn().mockResolvedValue(new Uint8Array()),
      };

      vi.spyOn(PDFDocument, 'create').mockResolvedValue(mockNewPdfDoc as any);
      const loadSpy = vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockSourcePdfDoc as any);

      const doc = await PdfDoc.load(new Uint8Array());
      const extractedDoc = await doc.extractPageAsPdf(2);

      expect(PDFDocument.create).toHaveBeenCalled();
      expect(mockNewPdfDoc.copyPages).toHaveBeenCalledWith(mockSourcePdfDoc, [2]);
      expect(mockNewPdfDoc.addPage).toHaveBeenCalledWith(mockCopiedPage);
      expect(mockNewPdfDoc.save).toHaveBeenCalled();
      expect(extractedDoc).toBeInstanceOf(PdfDoc);
      // load is called twice: once for source doc, once for extracted doc
      expect(loadSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('replacePage', () => {
    it('should replace a page at the specified index', async () => {
      const mockCopiedPage = { type: 'newPage' };
      const mockSourcePdfDoc = {
        copyPages: vi.fn().mockResolvedValue([mockCopiedPage]),
        removePage: vi.fn(),
        insertPage: vi.fn(),
        save: vi.fn().mockResolvedValue(new Uint8Array([13, 14, 15])),
      };
      const mockNewPagePdfDoc = {
        save: vi.fn().mockResolvedValue(new Uint8Array()),
      };

      vi.spyOn(PDFDocument, 'load')
        .mockResolvedValueOnce(mockSourcePdfDoc as any)
        .mockResolvedValueOnce(mockNewPagePdfDoc as any);

      const doc = await PdfDoc.load(new Uint8Array());
      const newPageDoc = await PdfDoc.load(new Uint8Array());
      await doc.replacePage(1, newPageDoc);

      expect(mockSourcePdfDoc.copyPages).toHaveBeenCalledWith(mockNewPagePdfDoc, [0]);
      expect(mockSourcePdfDoc.removePage).toHaveBeenCalledWith(1);
      expect(mockSourcePdfDoc.insertPage).toHaveBeenCalledWith(1, mockCopiedPage);
      expect(mockSourcePdfDoc.save).toHaveBeenCalled();
    });
  });

  describe('isPageLevelEdit', () => {
    it('should return true for insert-text edit', () => {
      const edit: SerializableEdit<InsertTextEdit> = {
        id: 'test-id',
        type: 'insert-text',
        page: 0,
        timestamp: Date.now(),
        edit: {
          type: 'insert-text',
          page: 0,
          value: 'test',
          position: { x: 0, y: 0 },
        },
      };
      expect(PdfDoc.isPageLevelEdit(edit)).toBe(true);
    });

    it('should return true for delete-text edit', () => {
      const edit: SerializableEdit<DeleteTextEdit> = {
        id: 'test-id',
        type: 'delete-text',
        page: 0,
        timestamp: Date.now(),
        edit: {
          type: 'delete-text',
          page: 0,
          oldValue: 'deleted text',
          position: { x: 0, y: 0 },
        },
      };
      expect(PdfDoc.isPageLevelEdit(edit)).toBe(true);
    });

    it('should return true for replace-text edit', () => {
      const edit: SerializableEdit<ReplaceTextEdit> = {
        id: 'test-id',
        type: 'replace-text',
        page: 0,
        timestamp: Date.now(),
        edit: {
          type: 'replace-text',
          page: 0,
          oldValue: 'old',
          newValue: 'new',
          position: { x: 0, y: 0 },
        },
      };
      expect(PdfDoc.isPageLevelEdit(edit)).toBe(true);
    });

    it('should return true for highlight edit', () => {
      const edit: SerializableEdit<HighlightEdit> = {
        id: 'test-id',
        type: 'highlight',
        page: 0,
        timestamp: Date.now(),
        edit: {
          type: 'highlight',
          page: 0,
          rect: { x: 0, y: 0, width: 100, height: 20 },
        },
      };
      expect(PdfDoc.isPageLevelEdit(edit)).toBe(true);
    });

    it('should return true for add-sticky-note edit', () => {
      const edit: SerializableEdit<AddStickyNoteEdit> = {
        id: 'test-id',
        type: 'add-sticky-note',
        page: 0,
        timestamp: Date.now(),
        edit: {
          type: 'add-sticky-note',
          page: 0,
          position: { x: 0, y: 0 },
          text: 'note text',
        },
      };
      expect(PdfDoc.isPageLevelEdit(edit)).toBe(true);
    });

    it('should return true for free-text edit', () => {
      const edit: SerializableEdit<FreeTextEdit> = {
        id: 'test-id',
        type: 'free-text',
        page: 0,
        timestamp: Date.now(),
        edit: {
          type: 'free-text',
          page: 0,
          text: 'free text',
          position: { x: 0, y: 0 },
        },
      };
      expect(PdfDoc.isPageLevelEdit(edit)).toBe(true);
    });

    it('should return true for redact edit', () => {
      const edit: SerializableEdit<RedactionEdit> = {
        id: 'test-id',
        type: 'redact',
        page: 0,
        timestamp: Date.now(),
        edit: {
          type: 'redact',
          page: 0,
          rect: { x: 0, y: 0, width: 100, height: 20 },
        },
      };
      expect(PdfDoc.isPageLevelEdit(edit)).toBe(true);
    });

    it('should return false for unknown edit type', () => {
      const edit: SerializableEdit<PdfEdit> = {
        id: 'test-id',
        type: 'unknown-type',
        page: 0,
        timestamp: Date.now(),
        edit: {
          type: 'unknown-type',
          page: 0,
        } as PdfEdit,
      };
      expect(PdfDoc.isPageLevelEdit(edit)).toBe(false);
    });
  });
});