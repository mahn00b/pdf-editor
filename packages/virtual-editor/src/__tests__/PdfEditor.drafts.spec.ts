import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStorage, createMockPdfDoc, createMockEdit } from './setup';
import { PdfEditor } from '../editor'; // adjust path as needed

describe('PdfEditor.saveDraftToDB', () => {
  let editor: PdfEditor;
  let storage: ReturnType<typeof createMockStorage>;
  let pdf: ReturnType<typeof createMockPdfDoc>;

  beforeEach(async () => {
    storage = createMockStorage();
    pdf = createMockPdfDoc();

    // Mock getLatestVersion to return our pdf for the factory
    (storage.getLatestVersion as any).mockResolvedValueOnce(pdf);

    // Create real editor instance using factory
    editor = await PdfEditor.create('doc-1', {
      storage,
      persistMode: 'snapshot',
      onDraftSaved: vi.fn(),
    });

    // mock save() output to be predictable
    pdf.save = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
  });

  // ---------------------------------------------------------------------------
  it('should do nothing if no draft edits', async () => {
    editor['draftEdits'] = [];

    const result = await editor.saveDraftToDB();

    expect(result).toBeNull();
    expect(storage.saveVersion).not.toHaveBeenCalled();
    expect(editor['onDraftSaved']).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  it('should persist snapshot when persistMode=snapshot', async () => {
    editor['persistMode'] = 'snapshot';
    editor['draftEdits'] = [createMockEdit('insert-text')];

    const result = await editor.saveDraftToDB();

    expect(storage.saveVersion).toHaveBeenCalledTimes(1);
    const call = (storage.saveVersion as any).mock.calls[0];

    expect(call[0]).toBe('doc-1');
    expect(call[1]).toBe(pdf);
    expect(call[2]).toBe(true);
    expect(call[3]).toBeUndefined();

    expect(result).toEqual({ id: 1, version: 2 });
    expect(editor['draftEdits'].length).toBe(0);
    expect(editor['onDraftSaved']).toHaveBeenCalledWith({ id: 1, version: 2 });
  });

  // ---------------------------------------------------------------------------
  it('should persist delta when persistMode=delta', async () => {
    editor['persistMode'] = 'delta';

    const edits = [
      createMockEdit('insert-text'),
      createMockEdit('delete-text'),
    ];

    editor['draftEdits'] = [...edits];

    const result = await editor.saveDraftToDB();

    expect(storage.saveVersion).toHaveBeenCalledTimes(1);

    const call = (storage.saveVersion as any).mock.calls[0];
    expect(call[0]).toBe('doc-1');
    expect(call[1]).toBe(pdf);
    expect(call[2]).toBe(false);
    expect(call[3]).toEqual(edits);

    expect(result).toEqual({ id: 1, version: 2 });
    expect(editor['onDraftSaved']).toHaveBeenCalledWith({ id: 1, version: 2 });
    expect(editor['draftEdits'].length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  it('should update currentVersion after save', async () => {
    editor['currentVersion'] = 0;
    editor['draftEdits'] = [createMockEdit()];

    await editor.saveDraftToDB();

    expect(editor['currentVersion']).toBe(2);
  });

  // ---------------------------------------------------------------------------
  it('should clear draftEdits after successful save', async () => {
    editor['draftEdits'] = [
      createMockEdit('insert-text'),
      createMockEdit('delete-text'),
    ];

    await editor.saveDraftToDB();

    expect(editor['draftEdits'].length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  it('should call onDraftSaved with proper result', async () => {
    editor['draftEdits'] = [createMockEdit()];

    const result = await editor.saveDraftToDB();

    expect(editor['onDraftSaved']).toHaveBeenCalledWith(result);
  });

  // ---------------------------------------------------------------------------
  it('should throw and call onDraftSaved(null) if persist fails', async () => {
    editor['persistMode'] = 'snapshot';
    editor['draftEdits'] = [createMockEdit()];

    (storage.saveVersion as any).mockImplementation(() => {
      throw new Error('failed to persist');
    });

    await expect(editor.saveDraftToDB()).rejects.toThrow('failed to persist');

    expect(editor['onDraftSaved']).toHaveBeenCalledWith(null);
    expect(editor['draftEdits'].length).toBe(1); // ensure not cleared
  });
});
