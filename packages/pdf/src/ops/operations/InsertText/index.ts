import type { InsertTextEdit } from '../../types';
import BaseOperation from '../../BaseOperation';
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export class InsertTextOperation extends BaseOperation<InsertTextEdit> {
  constructor(public edit: InsertTextEdit) {
    super(edit);
  }

  async apply(pdfDoc: PDFDocument): Promise<PDFDocument> {
    const {
      page: pageIndex,
      value,
      position,
      font,
      color = { r: 0, g: 0, b: 0 },
    } = this.edit;

    const page = pdfDoc.getPage(pageIndex);
    const fontFamily = font?.family ?? StandardFonts.Helvetica;
    const fontSize = font?.size ?? 12;

    const embeddedFont = await pdfDoc.embedFont(fontFamily);

    page.drawText(value, {
      x: position.x,
      y: position.y,
      size: fontSize,
      font: embeddedFont,
      color: rgb(color.r, color.g, color.b),
    });

    return pdfDoc;
  }
}
