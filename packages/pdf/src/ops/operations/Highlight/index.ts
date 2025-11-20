import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import { BaseOperation } from '../../../core/BaseOperation';
import type { HighlightEdit } from '../../types';

export class HighlightOperation extends BaseOperation<HighlightEdit> {
  constructor(edit: HighlightEdit) {
    super(edit);
  }

  async applyEdit(pdfDoc: PDFDocument): Promise<this> {
    const page = pdfDoc.getPages()[this.edit.page] as PDFPage;
    const { rect, color = { r: 1, g: 1, b: 0 } } = this.edit; // default yellow

    page.drawRectangle({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      color: rgb(color.r, color.g, color.b),
      opacity: 0.3,
    });

    return this;
  }
}