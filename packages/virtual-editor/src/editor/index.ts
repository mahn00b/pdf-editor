import { PdfDoc } from "@pdf-editor/pdf";
import type { SerializableEdit, PdfEdit } from "@pdf-editor/pdf";
import type { PdfVersionDB } from "@pdf-editor/storage";
import type {
  PersistMode,
  PdfEditorOptions,
  Snapshot
} from '@types'

/**
 * PdfEditor orchestrates editing a single PDF document (one documentId).
 * Supports page-level and document-level undo/redo snapshots.
 */
export class PdfEditor {
  private pdf: PdfDoc;
  private readonly storage: PdfVersionDB;
  private readonly documentId: string;

  private draftEdits: SerializableEdit<PdfEdit>[] = [];
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];
  private versionSnapshots = new Map<number, Uint8Array>();

  private currentVersion?: number;
  private persistMode: PersistMode;
  private readonly onEditApplied?: (edits: SerializableEdit<PdfEdit>[]) => void;
  private readonly onUndo?: () => void;
  private readonly onRedo?: () => void;
  private readonly onDraftSaved?: (result: { id: number; version: number } | null) => void;
  private readonly maxUndoStackSize?: number;

  private constructor(
    pdf: PdfDoc,
    storage: PdfVersionDB,
    documentId: string,
    currentVersion?: number,
    options?: PdfEditorOptions
  ) {
    this.pdf = pdf;
    this.storage = storage;
    this.documentId = documentId;
    this.currentVersion = currentVersion;
    this.persistMode = options?.persistMode ?? "snapshot";
    this.onEditApplied = options?.onEditApplied;
    this.onUndo = options?.onUndo;
    this.onRedo = options?.onRedo;
    this.onDraftSaved = options?.onDraftSaved;
    this.maxUndoStackSize = options?.maxUndoStackSize;
  }

  // -----------------------
  // Async factory
  // -----------------------
  static async create(documentId: string, options: PdfEditorOptions): Promise<PdfEditor> {
    const storage = options.storage;
    const latest = await storage.getLatestVersion(documentId);
    if (!latest) throw new Error(`No persisted document found for id ${documentId}`);

    const ver = latest.getVersion?.() ?? undefined;
    const editor = new PdfEditor(latest, storage, documentId, ver, options);

    const raw = await latest.save();
    editor.undoStack.push({ isPageLevel: false, createdAt: Date.now(), data: raw });
    if (ver != null) editor.versionSnapshots.set(ver, raw);

    return editor;
  }

  // -----------------------
  // Accessors / small helpers
  // -----------------------
  getPdf(): PdfDoc {
    return this.pdf;
  }

  getDraftEdits(): SerializableEdit<PdfEdit>[] {
    return [...this.draftEdits];
  }

  getCurrentVersion(): number | undefined {
    return this.currentVersion;
  }

  setPersistMode(mode: PersistMode) {
    this.persistMode = mode;
  }

  private enforceUndoLimit() {
    if (!this.maxUndoStackSize) return;
    while (this.undoStack.length > this.maxUndoStackSize) {
      this.undoStack.shift();
    }
  }

  // -----------------------
  // Core: apply edits
  // -----------------------
  async applyEdits(edits: SerializableEdit<PdfEdit>[]): Promise<void> {
    if (!edits || edits.length === 0) return;

    for (const edit of edits) {
      const isPageLevel = PdfDoc.toEditType(edit).isPageLevel();

      if (isPageLevel) {
        // snapshot only this page
        const pageIndex = edit.edit.page;
        const pageDoc = await this.pdf.extractPageAsPdf(pageIndex); // helper to extract a single-page PDF
        const pageBytes = await pageDoc.save();
        this.undoStack.push({ isPageLevel: true, pageIndex, createdAt: Date.now(), data: pageBytes });
      } else {
        const fullBytes = await this.pdf.save();
        this.undoStack.push({ isPageLevel: false, createdAt: Date.now(), data: fullBytes });
      }

      this.enforceUndoLimit();
    }

    await this.pdf.applyOperations(edits);

    // clear redo stack
    this.redoStack = [];

    // track unsaved edits
    this.draftEdits.push(...edits);

    this.onEditApplied?.(edits);

    // persist automatically
    try {
      if (this.persistMode === "snapshot") {
        const res = await this.storage.saveVersion(this.documentId, this.pdf, true);
        this.currentVersion = res.version;
        const afterBytes = await this.pdf.save();
        this.versionSnapshots.set(res.version, afterBytes);
        this.draftEdits = [];
        this.onDraftSaved?.(res);
      } else {
        const res = await this.storage.saveVersion(this.documentId, this.pdf, false, edits);
        this.currentVersion = res.version;
        const afterBytes = await this.pdf.save();
        this.versionSnapshots.set(res.version, afterBytes);
        this.draftEdits = [];
        this.onDraftSaved?.(res);
      }
    } catch (err) {
      this.onDraftSaved?.(null);
      throw err;
    }
  }

  async saveDraftToDB(): Promise<{ id: number; version: number } | null> {
    if (this.draftEdits.length === 0) return null;

    try {
      if (this.persistMode === "snapshot") {
        const res = await this.storage.saveVersion(this.documentId, this.pdf, true);
        this.currentVersion = res.version;
        const afterBytes = await this.pdf.save();
        this.versionSnapshots.set(res.version, afterBytes);
        this.draftEdits = [];
        this.onDraftSaved?.(res);
        return res;
      } else {
        const res = await this.storage.saveVersion(this.documentId, this.pdf, false, this.draftEdits);
        this.currentVersion = res.version;
        const afterBytes = await this.pdf.save();
        this.versionSnapshots.set(res.version, afterBytes);
        this.draftEdits = [];
        this.onDraftSaved?.(res);
        return res;
      }
    } catch (err) {
      this.onDraftSaved?.(null);
      throw err;
    }
  }

  // -----------------------
  // Undo/Redo (support page-level snapshots)
  // -----------------------
  async undo(): Promise<void> {
    if (this.undoStack.length <= 1) return;

    const topSnapshot = this.undoStack.pop()!;

    if (topSnapshot.isPageLevel) {
      // Save current page state for redo (matching metadata with data)
      const currentPageDoc = await this.pdf.extractPageAsPdf(topSnapshot.pageIndex);
      const currentPageBytes = await currentPageDoc.save();
      this.redoStack.push({
        isPageLevel: true,
        pageIndex: topSnapshot.pageIndex,
        createdAt: Date.now(),
        data: currentPageBytes
      });
      // Restore the page to previous state
      const prevPageDoc = await PdfDoc.load(topSnapshot.data);
      await this.pdf.replacePage(topSnapshot.pageIndex, prevPageDoc);
    } else {
      // Save current full document for redo
      const currentBytes = await this.pdf.save();
      this.redoStack.push({
        isPageLevel: false,
        createdAt: Date.now(),
        data: currentBytes
      });
      // Restore the full document
      this.pdf = await PdfDoc.load(topSnapshot.data);
    }

    this.draftEdits = [];
    this.onUndo?.();
  }

  async redo(): Promise<void> {
    if (this.redoStack.length === 0) return;

    const snapshot = this.redoStack.pop()!;

    if (snapshot.isPageLevel) {
      // Save current page state for undo (matching metadata with data)
      const currentPageDoc = await this.pdf.extractPageAsPdf(snapshot.pageIndex);
      const currentPageBytes = await currentPageDoc.save();
      this.undoStack.push({
        isPageLevel: true,
        pageIndex: snapshot.pageIndex,
        createdAt: Date.now(),
        data: currentPageBytes
      });
      // Apply the redo (restore page)
      const redoPageDoc = await PdfDoc.load(snapshot.data);
      await this.pdf.replacePage(snapshot.pageIndex, redoPageDoc);
    } else {
      // Save current full document for undo
      const currentBytes = await this.pdf.save();
      this.undoStack.push({
        isPageLevel: false,
        createdAt: Date.now(),
        data: currentBytes
      });
      // Restore the full document
      this.pdf = await PdfDoc.load(snapshot.data);
    }

    this.draftEdits = [];
    this.onRedo?.();
  }

  // -----------------------
  // Restore persisted version
  // -----------------------
  async restoreVersion(versionNumber: number): Promise<PdfDoc | null> {
    const persistedDoc = await this.storage.getVersion(this.documentId, versionNumber);
    if (!persistedDoc) return null;

    const currentBytes = await this.pdf.save();
    this.undoStack.push({ isPageLevel: false, createdAt: Date.now(), data: currentBytes });

    this.pdf = persistedDoc;
    this.currentVersion = versionNumber;

    const snapBytes = await persistedDoc.save();
    this.versionSnapshots.set(versionNumber, snapBytes);
    this.draftEdits = [];

    return this.pdf;
  }

  async restoreLatest(): Promise<PdfDoc | null> {
    const latest = await this.storage.getLatestVersion(this.documentId);
    if (!latest) return null;

    const currentBytes = await this.pdf.save();
    this.undoStack.push({ isPageLevel: false, createdAt: Date.now(), data: currentBytes });

    this.pdf = latest;
    this.currentVersion = latest.getVersion?.() ?? undefined;

    const snapBytes = await latest.save();
    if (this.currentVersion != null) this.versionSnapshots.set(this.currentVersion, snapBytes);
    this.draftEdits = [];

    return this.pdf;
  }

  // -----------------------
  // Reset draft
  // -----------------------
  resetDraft(): void {
    this.draftEdits = [];
    this.undoStack = [];
    this.redoStack = [];
    void (async () => {
      const bytes = await this.pdf.save();
      this.undoStack.push({ isPageLevel: false, createdAt: Date.now(), data: bytes });
    })();
  }
}