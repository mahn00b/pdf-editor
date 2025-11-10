import { PDFDocument, rgb } from 'pdf-lib';
import { BaseOperation } from '../../BaseOperation';
import type { StickyNoteEdit } from '../types';

export class StickyNoteOperation extends BaseOperation<StickyNoteEdit> {
  constructor(edit: StickyNoteEdit) {
    super(edit);
  }

  async apply(pdfDoc: PDFDocument): Promise<this> {
    const page = pdfDoc.getPages()[this.edit.page];
    const { position, text } = this.edit;

    // Draw a small yellow square as a visual marker for the note
    page.drawRectangle({
      x: position.x,
      y: position.y,
      width: 16,
      height: 16,
      color: rgb(1, 1, 0),
      borderColor: rgb(0.8, 0.8, 0),
      borderWidth: 1,
      opacity: 0.6,
    });

    // Optionally draw note text nearby (debug-only, not for production PDF UX)
    if (text) {
      page.drawText(text, {
        x: position.x + 20,
        y: position.y + 2,
        size: 10,
        color: rgb(0, 0, 0),
      });
    }

    return this;
  }
}
