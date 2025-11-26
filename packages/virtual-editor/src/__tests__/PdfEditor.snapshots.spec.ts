// tests/restoreVersion.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PdfEditor } from "../editor";
import type { PdfDoc } from "@pdf-editor/pdf";
import type { PdfVersionDB } from "@pdf-editor/storage";
import type { Snapshot } from "@types";

// -----------------------------------------
// Utilities / Mocks
// -----------------------------------------

function mockPdfDoc(bytes: Uint8Array, version?: number): PdfDoc {
  return {
    save: vi.fn().mockResolvedValue(bytes),
    getVersion: version ? vi.fn().mockReturnValue(version) : undefined
  } as unknown as PdfDoc;
}

function mockStorage(versions: Map<number, PdfDoc>): PdfVersionDB {
  return {
    getLatestVersion: vi.fn(async (_id: string) => {
      if (versions.size === 0) return null;
      const max = Math.max(...Array.from(versions.keys()));
      return versions.get(max)!;
    }),
    getVersion: vi.fn(async (_id: string, v: number) => {
      return versions.get(v) ?? null;
    }),
    saveVersion: vi.fn(async () => {
      throw new Error("saveVersion should not be called in restore tests");
    })
  } as unknown as PdfVersionDB;
}

// -----------------------------------------
// Fixtures
// -----------------------------------------

const DOC_A_BYTES = new Uint8Array([1, 2, 3]); // initial
const DOC_B_BYTES = new Uint8Array([9, 9, 9]); // persisted version 2
const DOC_C_BYTES = new Uint8Array([7, 7, 7]); // persisted version 3

let storage: PdfVersionDB;
let initialPdf: PdfDoc;
let editor: PdfEditor;

beforeEach(async () => {
  const versions = new Map<number, PdfDoc>();
  versions.set(2, mockPdfDoc(DOC_B_BYTES, 2));
  versions.set(3, mockPdfDoc(DOC_C_BYTES, 3));

  storage = mockStorage(versions);

  initialPdf = mockPdfDoc(DOC_A_BYTES, 1);

  // editor.create calls getLatestVersion() internally
  (storage.getLatestVersion as any).mockResolvedValueOnce(initialPdf);

  editor = await PdfEditor.create("doc-123", {
    storage,
    persistMode: "snapshot"
  });
});

// -----------------------------------------
// TESTS
// -----------------------------------------

describe("PdfEditor.restoreVersion", () => {
  it("pushes a document-level snapshot onto undoStack", async () => {
    const beforeUndoCount = (editor as any).undoStack.length;

    await editor.restoreVersion(2);

    const afterUndoCount = (editor as any).undoStack.length;
    expect(afterUndoCount).toBe(beforeUndoCount + 1);

    const snap: Snapshot = (editor as any).undoStack.at(-1);
    expect(snap.isPageLevel).toBe(false);
    expect(snap.data).toBeInstanceOf(Uint8Array);
    expect(snap.createdAt).toBeTypeOf("number");
  });

  it("replaces the editor.pdf instance with the persisted version", async () => {
    const originalPdf = editor.getPdf();

    await editor.restoreVersion(2);

    const newPdf = editor.getPdf();
    expect(newPdf).not.toBe(originalPdf);
  });

  it("updates currentVersion to the restored version", async () => {
    expect(editor.getCurrentVersion()).toBe(1); // from initialPdf

    await editor.restoreVersion(3);

    expect(editor.getCurrentVersion()).toBe(3);
  });

  it("stores serialized bytes of the restored version in versionSnapshots", async () => {
    await editor.restoreVersion(2);

    const snapshots = (editor as any).versionSnapshots;
    expect(snapshots.get(2)).toEqual(DOC_B_BYTES);
  });

  it("clears draftEdits after restoring", async () => {
    // Put a fake draft in
    (editor as any).draftEdits.push({
      id: "edit1",
      type: "insert-text",
      page: 0,
      timestamp: Date.now(),
      edit: {
        type: "insert-text",
        page: 0,
        value: "Hello",
        position: { x: 0, y: 0 }
      }
    });

    await editor.restoreVersion(2);

    expect(editor.getDraftEdits().length).toBe(0);
  });

  it("returns null if the version does not exist", async () => {
    const result = await editor.restoreVersion(999);
    expect(result).toBeNull();
  });
});

// -----------------------------------------
// restoreLatest()
// -----------------------------------------

describe("PdfEditor.restoreLatest", () => {
  it("restores the latest version and pushes a document-level snapshot", async () => {

    const beforeUndo = (editor as any).undoStack.length;
    await editor.restoreLatest();
    const afterUndo = (editor as any).undoStack.length;

    expect(afterUndo).toBe(beforeUndo + 1);

    const snap: Snapshot = (editor as any).undoStack.at(-1);
    expect(snap.isPageLevel).toBe(false);
    expect(snap.data).toBeInstanceOf(Uint8Array);
  });

  it("updates currentVersion to the latest version", async () => {
    await editor.restoreLatest();
    expect(editor.getCurrentVersion()).toBe(3);
  });

  it("stores latest version bytes into versionSnapshots", async () => {
    await editor.restoreLatest();

    const snapshots = (editor as any).versionSnapshots;
    expect(snapshots.get(3)).toEqual(DOC_C_BYTES);
  });

  it("replaces the editor.pdf instance", async () => {
    const previous = editor.getPdf();
    await editor.restoreLatest();
    const now = editor.getPdf();
    expect(now).not.toBe(previous);
  });
});
