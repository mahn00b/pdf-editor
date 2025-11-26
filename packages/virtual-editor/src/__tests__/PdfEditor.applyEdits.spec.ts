import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PdfEditor } from '../editor';
import { createMockPdfDoc, createMockStorage, createMockEdit } from './setup';
import type { PdfEditorOptions, Snapshot } from '@types';
import type { PdfEdit, SerializableEdit } from '@pdf-editor/pdf';

describe("PdfEditor: applyEdits & undo/redo snapshots", () => {
  let editor: PdfEditor;
  let options: PdfEditorOptions;
  let storage: any;

  beforeEach(async () => {
    storage = createMockStorage();
    options = { storage };
    const pdfDoc = createMockPdfDoc();
    editor = await PdfEditor.create("doc-1", { ...options });
  });

  it("pushes document-level snapshot to undoStack and clears redoStack", async () => {
    const edit = createMockEdit();

    editor['redoStack'].push({
      isPageLevel: false,
      createdAt: Date.now(),
      data: new Uint8Array([1,2,3])
    } as Snapshot);

    const undoLengthBefore = editor['undoStack'].length;

    await editor.applyEdits([edit]);

    const lastSnapshot = editor['undoStack'][editor['undoStack'].length - 1];
    expect(lastSnapshot).toHaveProperty('isPageLevel');
    expect(lastSnapshot).toHaveProperty('createdAt');
    expect(lastSnapshot).toHaveProperty('data');
    expect(editor['redoStack'].length).toBe(0);
    expect(editor['undoStack'].length).toBeGreaterThan(undoLengthBefore);
  });

  it("applies edits via PdfDoc.applyOperations", async () => {
    const edit = createMockEdit();
    await editor.applyEdits([edit]);

    expect(editor.getPdf().applyOperations).toHaveBeenCalledWith([edit]);
  });

  it("tracks draftEdits after applyEdits on autosave", async () => {
    const edit = createMockEdit();
    await editor.applyEdits([edit]);

    const drafts = editor.getDraftEdits();
    // Edits are auto-saved and cleared by default
    expect(drafts.length).toBe(0);
  });

  it("persists version in snapshot mode", async () => {
    editor.setPersistMode("snapshot");
    const edit = createMockEdit();
    await editor.applyEdits([edit]);

    expect(storage.saveVersion).toHaveBeenCalledWith(
      editor['documentId'],
      editor.getPdf(),
      true
    );
  });

  it("persists version in delta mode", async () => {
    editor.setPersistMode("delta");
    const edit = createMockEdit();
    await editor.applyEdits([edit]);

    expect(storage.saveVersion).toHaveBeenCalledWith(
      editor['documentId'],
      editor.getPdf(),
      false,
      [edit]
    );
  });

  it("undo restores previous snapshot and clears draftEdits", async () => {
    const edit = createMockEdit();
    await editor.applyEdits([edit]);

    const undoStackBefore = editor['undoStack'].length;
    const redoStackBefore = editor['redoStack'].length;

    await editor.undo();

    expect(editor.getDraftEdits().length).toBe(0);
    expect(editor['undoStack'].length).toBeLessThanOrEqual(undoStackBefore);
    expect(editor['redoStack'].length).toBeGreaterThan(redoStackBefore);
  });

  it("redo restores snapshot from redoStack", async () => {
    const edit = createMockEdit();
    await editor.applyEdits([edit]);
    await editor.undo();

    const redoLengthBefore = editor['redoStack'].length;
    await editor.redo();

    expect(editor['redoStack'].length).toBeLessThan(redoLengthBefore);
    expect(editor.getDraftEdits().length).toBe(0);
  });
});