import { PDFDocument } from 'pdf-lib';

// --- Edit Types
import {
  InsertTextEdit,
  DeleteTextEdit,
  ReplaceTextEdit,
  HighlightEdit,
  StickyNoteEdit,
  FreeTextEdit,
  RedactionEdit,
} from '@types';

// --- Operation Implementations
import { InsertTextOperation } from '../ops/operations/InsertText';
import { DeleteTextOperation } from '../ops/operations/DeleteText';
import { ReplaceTextOperation } from '../ops/operations/ReplaceText';
import { HighlightOperation } from '../ops/operations/Highlight';
import { StickyNoteOperation } from '../ops/operations/StickyNote';
import { FreeTextOperation } from '../ops/operations/FreeText';      // NEW
import { RedactionOperation } from '../ops/operations/Redaction';    // NEW
import { findText } from '@query/queries/FindText';

export class PdfDoc {
  private readonly pdf: PDFDocument;
  private rawData: Uint8Array; // always up-to-date version of the PDF as bytes

  private constructor(pdfDoc: PDFDocument, rawData: Uint8Array) {
    this.pdf = pdfDoc;
    this.rawData = rawData;
  }

  static async load(data: ArrayBuffer | Uint8Array) {
    const pdfDoc = await PDFDocument.load(data);
    return new PdfDoc(pdfDoc, data instanceof Uint8Array ? data : new Uint8Array(data));
  }

  /**
   * Re-serializes the pdf-lib document and caches updated bytes.
   */
  private async syncBytes() {
    this.rawData = await this.pdf.save();
  }

  /**
   * Delegates to the standalone findText utility.
   */
  async findText(query: string) {
    // Ensure the PDF bytes reflect the latest edits
    await this.syncBytes();

    return findText(this.rawData, query);
  }
  // -----------------------------
  // INSERT TEXT
  // -----------------------------
  async insertText(edit: InsertTextEdit) {
    await new InsertTextOperation(edit).applyEdit(this.pdf);
    return this;
  }

  // -----------------------------
  // DELETE TEXT
  // -----------------------------
  async deleteText(edit: DeleteTextEdit) {
    await new DeleteTextOperation(edit).applyEdit(this.pdf);
    return this;
  }

  // -----------------------------
  // REPLACE TEXT
  // -----------------------------
  async replaceText(edit: ReplaceTextEdit) {
    await new ReplaceTextOperation(edit).applyEdit(this.pdf);
    return this;
  }

  // -----------------------------
  // HIGHLIGHT
  // -----------------------------
  async highlight(edit: HighlightEdit) {
    await new HighlightOperation(edit).applyEdit(this.pdf);
    return this;
  }

  // -----------------------------
  // STICKY NOTE
  // -----------------------------
  async stickyNote(edit: StickyNoteEdit) {
    await new StickyNoteOperation(edit).applyEdit(this.pdf);
    return this;
  }

  // -----------------------------
  // FREE TEXT BOX
  // -----------------------------
  async freeText(edit: FreeTextEdit) {
    await new FreeTextOperation(edit).applyEdit(this.pdf);
    return this;
  }

  // -----------------------------
  // REDACTION
  // -----------------------------
  async redact(edit: RedactionEdit) {
    await new RedactionOperation(edit).applyEdit(this.pdf);
    return this;
  }
}
