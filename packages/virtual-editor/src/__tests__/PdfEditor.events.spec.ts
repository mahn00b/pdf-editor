import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PdfEditor } from '../editor';
import {
  createMockStorage,
  createMockEditorContext,
  createMockPdfDoc,
  createMockEdit,
} from './setup';

describe('PdfEditor – Event Hooks', () => {
  let storage: ReturnType<typeof createMockStorage>;
  let ctx: ReturnType<typeof createMockEditorContext>;
  let pdf: ReturnType<typeof createMockPdfDoc>;

  beforeEach(() => {
    storage = createMockStorage();
    pdf = createMockPdfDoc();

    ctx = createMockEditorContext({
      storage,
      onEditApplied: vi.fn(),
      onDraftSaved: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn()
    });

    // Ensure factory can load initial doc
    (storage.getLatestVersion as any).mockResolvedValue(pdf);
  });

  async function createEditor() {
    return await PdfEditor.create('doc1', ctx);
  }

  // ---------------------------------------------------------------------------------------------
  // onEditApplied
  // ---------------------------------------------------------------------------------------------
  it('calls onEditApplied when applyEdits is invoked', async () => {
    const editor = await createEditor();

    const edits = [createMockEdit('insert-text')];

    await editor.applyEdits(edits);

    expect(ctx.onEditApplied).toHaveBeenCalledTimes(1);
    expect(ctx.onEditApplied).toHaveBeenCalledWith(edits);
  });

  // ---------------------------------------------------------------------------------------------
  // onDraftSaved (snapshot mode)
  // ---------------------------------------------------------------------------------------------
  it('calls onDraftSaved after a successful persist (snapshot mode)', async () => {
    const editor = await createEditor();
    editor.setPersistMode('snapshot');

    const edits = [createMockEdit('insert-text')];

    await editor.applyEdits(edits);

    expect(ctx.onDraftSaved).toHaveBeenCalledTimes(1);

    // Mock storage returns { id: 1, version: 2 } (version + 1)
    const callArg = (ctx.onDraftSaved as any).mock.calls[0][0];
    expect(callArg).toMatchObject({ version: 2 });
  });

  it('calls onDraftSaved(null) if persistence fails', async () => {
    // Force saveVersion to throw
    (storage.saveVersion as any).mockImplementation(() => {
      throw new Error('fail');
    });

    const editor = await createEditor();

    const edits = [createMockEdit('insert-text')];

    await expect(editor.applyEdits(edits)).rejects.toThrow('fail');

    expect(ctx.onDraftSaved).toHaveBeenCalledTimes(1);
    expect(ctx.onDraftSaved).toHaveBeenCalledWith(null);
  });

  // ---------------------------------------------------------------------------------------------
  // onUndo
  // ---------------------------------------------------------------------------------------------
  it('calls onUndo when undo is invoked', async () => {
    const editor = await createEditor();

    // apply something so undo does something
    await editor.applyEdits([createMockEdit('insert-text')]);

    await editor.undo();

    expect(ctx.onUndo).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onUndo if undoStack only has initial state', async () => {
    const editor = await createEditor();

    await editor.undo();

    expect(ctx.onUndo).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------------------------
  // onRedo
  // ---------------------------------------------------------------------------------------------
  it('calls onRedo when redo is invoked after undo', async () => {
    const editor = await createEditor();

    await editor.applyEdits([createMockEdit('insert-text')]);
    await editor.undo();
    await editor.redo();

    expect(ctx.onRedo).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onRedo if redoStack is empty', async () => {
    const editor = await createEditor();

    await editor.redo();

    expect(ctx.onRedo).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------------------------
  // saveDraftToDB hooks
  // ---------------------------------------------------------------------------------------------
  it('calls onDraftSaved on saveDraftToDB (snapshot mode)', async () => {
    const editor = await createEditor();
    editor.setPersistMode('snapshot');

    // Manually inject a draft edit so saveDraftToDB has something to do
    // (applyEdits auto-saves, so we need to bypass that or just use applyEdits and check calls)
    // But here we want to test saveDraftToDB specifically.
    // We can simulate a draft by pushing to private draftEdits
    editor['draftEdits'] = [createMockEdit('insert-text')];

    (ctx.onDraftSaved as any).mockClear();

    await editor.saveDraftToDB();

    expect(ctx.onDraftSaved).toHaveBeenCalledTimes(1);
    const result = (ctx.onDraftSaved as any).mock.calls[0][0];
    expect(result).toMatchObject({ version: 2 });
  });

  it('calls onDraftSaved(null) when saveDraftToDB fails', async () => {
    const editor = await createEditor();
    editor['draftEdits'] = [createMockEdit('insert-text')];

    (ctx.onDraftSaved as any).mockClear();

    (storage.saveVersion as any).mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(editor.saveDraftToDB()).rejects.toThrow('boom');

    expect(ctx.onDraftSaved).toHaveBeenCalledWith(null);
  });
});
