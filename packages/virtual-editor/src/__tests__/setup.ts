import type { PdfDoc, SerializableEdit, PdfEdit } from "@pdf-editor/pdf";
import type { PdfVersionDB } from "@pdf-editor/storage";
import { vi } from "vitest";

import { PDFDocument } from 'pdf-lib';
import { DocumentLevelSnapshot, PageLevelSnapshot, PdfEditorOptions } from "@types";

/**
 * Create a mock PdfDoc instance.
 * All async methods are mocked to behave reasonably for testing.
 */
export function createMockPdfDoc(): PdfDoc {
  const mock: Partial<PdfDoc> = {
    save: vi.fn(async function () {
      const doc = await PDFDocument.create();
      doc.addPage();
      return await doc.save();
    }),
    getRawData: vi.fn(() => new Uint8Array([37, 80, 68, 70, 45])), // %PDF- header start
    applyOperations: vi.fn(async function (edits: SerializableEdit<PdfEdit>[]) {
      return mock as PdfDoc;
    }),
    clone: vi.fn(async function () {
      return mock as PdfDoc;
    }),
    findText: vi.fn(async function (query: string) {
      return [];
    }),
    setVersion: vi.fn(),
    getVersion: vi.fn(() => 1),
    extractPageAsPdf: vi.fn(async function (pageIndex: number) {
      return mock as PdfDoc;
    }),
    replacePage: vi.fn(async function (pageIndex: number, newPageDoc: PdfDoc) {
      return;
    }),
  };
  return mock as PdfDoc;
}

/**
 * Create a mock PdfVersionDB instance.
 */
export function createMockStorage(): PdfVersionDB {
  const mock: Partial<PdfVersionDB> = {
    saveVersion: vi.fn(async (documentId, pdfDoc, isFullSnapshot, edits) => ({
      id: 1,
      version: (pdfDoc.getVersion?.() ?? 0) + 1,
    })),
    getVersion: vi.fn(async (documentId, version) => createMockPdfDoc()),
    getLatestVersion: vi.fn(async (documentId) => createMockPdfDoc()),
    saveOperation: vi.fn(async (documentId, version, edit) => 1),
  };
  return mock as PdfVersionDB;
}

/**
 * Generate a fake SerializableEdit of a given type.
 */
export function createMockEdit(type: PdfEdit['type'] = 'insert-text'): SerializableEdit<PdfEdit> {
  const base: SerializableEdit<PdfEdit> = {
    id: 'fake-id',
    type,
    page: 0,
    timestamp: Date.now(),
    edit: {
      type,
      page: 0,
      position: { x: 0, y: 0 },
      value: type === 'insert-text' ? 'Hello' : undefined,
      oldValue: type === 'delete-text' || type === 'replace-text' ? 'Old' : undefined,
      newValue: type === 'replace-text' ? 'New' : undefined,
      rect: type === 'highlight' || type === 'redact' ? { x: 0, y: 0, width: 10, height: 10 } : undefined,
      text: type === 'add-sticky-note' || type === 'free-text' ? 'Note' : undefined,
    } as PdfEdit,
  };
  return base;
}

/**
 * Create a mock PdfEditor instance with real behavior on key fields.
 * This ensures the test suite is consistent with the real class shape.
 */
export function createMockPdfEditor(overrides: Partial<any> = {}) {
  return {
    documentId: 'doc-1',
    persistMode: overrides.persistMode ?? 'snapshot',

    pdf: overrides.pdf ?? createMockPdfDoc(),
    storage: overrides.storage ?? createMockStorage(),

    draftEdits: [],
    undoStack: [],
    redoStack: [],
    versionSnapshots: new Map(),

    currentVersion: overrides.currentVersion ?? 0,

    // hooks
    onEditApplied: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onDraftSaved: vi.fn(),

    // methods replaced by spies or fakes in tests
    saveDraftToDB: undefined, // replaced by test

    // allow overrides
    ...overrides,
  };
}

/**
 * Small helper for async event tick.
 */
export function awaitNextTick() {
  return new Promise(resolve => process.nextTick(resolve));
}

// -----------------------------------------------------------------------------
// Mock Snapshot Creators
// -----------------------------------------------------------------------------

export function createMockDocumentSnapshot(
  data: Uint8Array = new Uint8Array([1, 2, 3])
): DocumentLevelSnapshot {
  return {
    isPageLevel: false,
    data,
    createdAt: Date.now(),
  };
}

export function createMockPageSnapshot(
  pageIndex = 0,
  data: Uint8Array = new Uint8Array([9, 9, 9])
): PageLevelSnapshot {
  return {
    isPageLevel: true,
    pageIndex,
    data,
    createdAt: Date.now(),
  };
}

// -----------------------------------------------------------------------------
// Mock Editor Context
// -----------------------------------------------------------------------------

export function createMockEditorContext(overrides: Partial<PdfEditorOptions> = {}): PdfEditorOptions {
  const storage = overrides.storage ?? createMockStorage();

  return {
    storage,
    persistMode: overrides.persistMode ?? 'snapshot',
    onEditApplied: overrides.onEditApplied ?? vi.fn(),
    onDraftSaved: overrides.onDraftSaved ?? vi.fn(),
    onUndo: overrides.onUndo ?? vi.fn(),
    onRedo: overrides.onRedo ?? vi.fn(),
    // Add any new hooks here as PdfEditor evolves
  };
}