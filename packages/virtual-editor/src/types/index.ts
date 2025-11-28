import type { PdfEdit, SerializableEdit } from "@pdf-editor/pdf";
import type { PdfVersionDB } from "@pdf-editor/storage";

/**
 * Base type for any snapshot stored in undo/redo stacks.
 */
export interface BaseSnapshot {
  /** Whether this snapshot represents the full document or a single page */
  isPageLevel: boolean;
  /** Timestamp of when the snapshot was taken */
  createdAt: number;
}

/**
 * Snapshot of the entire PDF document.
 */
export interface DocumentLevelSnapshot extends BaseSnapshot {
  isPageLevel: false;
  /** Serialized full PDF bytes */
  data: Uint8Array;
}

/**
 * Snapshot of a single page of a PDF document.
 */
export interface PageLevelSnapshot extends BaseSnapshot {
  isPageLevel: true;
  /** 0-based page index */
  pageIndex: number;
  /** Serialized bytes for this page */
  data: Uint8Array;
}

/**
 * Union of all possible snapshot types.
 */
export type Snapshot = DocumentLevelSnapshot | PageLevelSnapshot;

/**
 * Configuration options for the PDF editor.
 */
export interface PdfEditorOptions {
  storage: PdfVersionDB;
  persistMode?: PersistMode;
  onEditApplied?: (edits: SerializableEdit<PdfEdit>[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDraftSaved?: (result: { id: number; version: number } | null) => void;
  maxUndoStackSize?: number;
}

/**
 * Persist mode for version saving.
 */
export type PersistMode = "snapshot" | "delta";

/**
 * Utility type to track which pages are affected by a set of edits.
 */
export type PageEditMap = Map<number, SerializableEdit<PdfEdit>[]>;
