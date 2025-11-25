import { PDFDocument } from 'pdf-lib';
import { readPDF, savePDF } from '@core/io';

// --- Edit Types
import {
  InsertTextEdit,
  DeleteTextEdit,
  ReplaceTextEdit,
  HighlightEdit,
  AddStickyNoteEdit,
  FreeTextEdit,
  RedactionEdit,
  SerializableEdit,
  PdfEdit
} from '@types';

// --- Operation Implementations
import { InsertTextOperation } from '../ops/operations/InsertText';
import { DeleteTextOperation } from '../ops/operations/DeleteText';
import { ReplaceTextOperation } from '../ops/operations/ReplaceText';
import { HighlightOperation } from '../ops/operations/Highlight';
import { StickyNoteOperation } from '../ops/operations/StickyNote';
import { FreeTextOperation } from '../ops/operations/FreeText';
import { RedactionOperation } from '../ops/operations/Redaction';
import { findText } from '@query/queries/FindText';

export class PdfDoc {
  private readonly pdf: PDFDocument;
  private rawData: Uint8Array; // always up-to-date version of the PDF as bytes
  public version?: number;

  private constructor(pdfDoc: PDFDocument, rawData: Uint8Array, version?: number) {
    this.pdf = pdfDoc;
    this.rawData = rawData;
    this.version = version;
  }

  static async load(data: ArrayBuffer | Uint8Array, version?: number): Promise<PdfDoc> {
    const pdfDoc = await readPDF(data);
    return new PdfDoc(pdfDoc, data instanceof Uint8Array ? data : new Uint8Array(data), version);
  }

  /**
   * Re-serializes the pdf-lib document and caches updated bytes.
   */
  private async syncBytes() {
    this.rawData = await savePDF(this.pdf);
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
  /**
   * Inserts text into the PDF at a specified position.
   *
   * @param edit - The insert text edit configuration containing the text value, position, and optional font/color settings
   * @returns The PdfDoc instance for method chaining
   */
  async insertText(edit: InsertTextEdit): Promise<SerializableEdit<InsertTextEdit>> {
    return (await new InsertTextOperation(edit).applyEdit(this.pdf)).serialize();
  }

  // -----------------------------
  // DELETE TEXT
  // -----------------------------
  /**
   * Deletes text from the PDF at a specified position.
   *
   * @param edit - The delete text edit configuration containing the oldValue (text being removed), position, and optional font settings
   * @returns The PdfDoc instance for method chaining
   */
  async deleteText(edit: DeleteTextEdit): Promise<SerializableEdit<DeleteTextEdit>> {
    return (await new DeleteTextOperation(edit).applyEdit(this.pdf)).serialize();
  }

  // -----------------------------
  // REPLACE TEXT
  // -----------------------------
  /**
   * Replaces existing text in the PDF with new text.
   *
   * @param edit - The replace text edit configuration containing oldValue, newValue, position, and optional font/color settings
   * @returns The PdfDoc instance for method chaining
   */
  async replaceText(edit: ReplaceTextEdit): Promise<SerializableEdit<ReplaceTextEdit>> {
    return (await new ReplaceTextOperation(edit).applyEdit(this.pdf)).serialize();
  }

  // -----------------------------
  // HIGHLIGHT
  // -----------------------------
  /**
   * Adds a highlight annotation to a rectangular area in the PDF.
   *
   * @param edit - The highlight edit configuration containing the rectangle dimensions and optional color
   * @returns The PdfDoc instance for method chaining
   */
  async highlight(edit: HighlightEdit): Promise<SerializableEdit<HighlightEdit>> {
    return (await new HighlightOperation(edit).applyEdit(this.pdf)).serialize();
  }

  // -----------------------------
  // STICKY NOTE
  // -----------------------------
  /**
   * Adds a sticky note annotation to the PDF at a specified position.
   *
   * @param edit - The sticky note edit configuration containing the text content and position
   * @returns The PdfDoc instance for method chaining
   */
  async addStickyNote(edit: AddStickyNoteEdit): Promise<SerializableEdit<AddStickyNoteEdit>> {
    return (await new StickyNoteOperation(edit).applyEdit(this.pdf)).serialize();
  }

  // -----------------------------
  // FREE TEXT BOX
  // -----------------------------
  /**
   * Adds a free text annotation (text box) to the PDF at a specified position.
   *
   * @param edit - The free text edit configuration containing the text, position, and optional font/color settings
   * @returns The PdfDoc instance for method chaining
   */
  async freeText(edit: FreeTextEdit): Promise<SerializableEdit<FreeTextEdit>> {
    return (await new FreeTextOperation(edit).applyEdit(this.pdf)).serialize();
  }

  // -----------------------------
  // REDACTION
  // -----------------------------
  /**
   * Redacts (permanently removes) content from a rectangular area in the PDF.
   *
   * @param edit - The redaction edit configuration containing the rectangle dimensions to redact
   * @returns The PdfDoc instance for method chaining
   */
  async redact(edit: RedactionEdit): Promise<SerializableEdit<RedactionEdit>> {
    return (await new RedactionOperation(edit).applyEdit(this.pdf)).serialize();
  }

  /**
   * Applies a batch of SerializableEdit objects to this PdfDoc.
   *
   * Operations are applied sequentially, in the order provided in the array.
   * After all operations are applied, {@link syncBytes} is called automatically to update the internal PDF data.
   * If the operations array is empty, no edits are applied, but {@link syncBytes} is still called and the method returns the instance.
   *
   * @param {SerializableEdit<PdfEdit>[]} operations - Array of PDF edits to apply sequentially
   * @returns {Promise<this>} Returns the same PdfDoc instance for chaining
   * @throws {Error} If any edit has an unknown type
   */
  async applyOperations(operations: SerializableEdit<PdfEdit>[]): Promise<this> {
    for (const op of operations) {

      switch (op.edit.type) {
        case "insert-text":
          await this.insertText(op.edit as InsertTextEdit);
          break;
        case "delete-text":
          await this.deleteText(op.edit as DeleteTextEdit);
          break;
        case "replace-text":
          await this.replaceText(op.edit as ReplaceTextEdit);
          break;
        case "highlight":
          await this.highlight(op.edit as HighlightEdit);
          break;
        case "add-sticky-note":
          await this.addStickyNote(op.edit as AddStickyNoteEdit);
          break;
        case "free-text":
          await this.freeText(op.edit as FreeTextEdit);
          break;
        case "redact":
          await this.redact(op.edit as RedactionEdit);
          break;
        default:
          throw new Error(`Unknown edit type: ${(op.edit as any).type}`);
      }
    }

    // Sync the internal rawData after all operations
    await this.syncBytes();

    return this;
  }

  /**
   * Returns the current raw data of the PDF.
   * Note: This returns the data as of the last save or load.
   * To get the most up-to-date data including recent edits, call save() instead.
   */
  getRawData(): Uint8Array {
    return this.rawData;
  }

  /**
   * Serializes the current PDF document, updates the internal raw data, and returns it.
   */
  async save(): Promise<Uint8Array> {
    await this.syncBytes();
    return this.rawData;
  }

  setVersion(version: number) {
    this.version = version;
  }

  getVersion() {
    return this.version ?? null;
  }

  async clone(): Promise<PdfDoc> {
    const bytes = await this.save();
    return PdfDoc.load(bytes, this.version);
  }
}
