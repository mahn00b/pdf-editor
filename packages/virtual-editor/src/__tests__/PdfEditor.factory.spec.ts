import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PdfEditor } from '../editor';
import { createMockPdfDoc, createMockStorage } from './setup';

describe('PdfEditor.create', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;
  let mockPdf: ReturnType<typeof createMockPdfDoc>;
  const documentId = 'doc-123';

  beforeEach(() => {
    mockPdf = createMockPdfDoc();
    mockStorage = createMockStorage();
  });

  it('throws if no persisted document exists', async () => {
    mockStorage.getLatestVersion = vi.fn(async () => null);

    await expect(PdfEditor.create(documentId, { storage: mockStorage }))
      .rejects
      .toThrow(`No persisted document found for id ${documentId}`);
  });

  it('loads latest version and sets up undo stack', async () => {
    // Arrange
    mockStorage.getLatestVersion = vi.fn(async () => mockPdf);

    // Act
    const editor = await PdfEditor.create(documentId, { storage: mockStorage });

    // Assert
    expect(editor.getPdf()).toBe(mockPdf);
    expect(editor.getCurrentVersion()).toBe(mockPdf.getVersion?.());
    expect(editor['undoStack'].length).toBe(1);
    expect(editor['redoStack'].length).toBe(0);
    expect(editor['versionSnapshots'].has(mockPdf.getVersion?.()!)).toBe(true);
  });

  it('sets persistMode and event hooks from options', async () => {
    mockStorage.getLatestVersion = vi.fn(async () => mockPdf);

    const onEditApplied = vi.fn();
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const onDraftSaved = vi.fn();

    const editor = await PdfEditor.create(documentId, {
      storage: mockStorage,
      persistMode: 'delta',
      onEditApplied,
      onUndo,
      onRedo,
      onDraftSaved,
      maxUndoStackSize: 5
    });

    expect(editor['persistMode']).toBe('delta');
    expect(editor['onEditApplied']).toBe(onEditApplied);
    expect(editor['onUndo']).toBe(onUndo);
    expect(editor['onRedo']).toBe(onRedo);
    expect(editor['onDraftSaved']).toBe(onDraftSaved);
    expect(editor['maxUndoStackSize']).toBe(5);
  });
});
