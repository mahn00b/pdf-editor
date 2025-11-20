import { PDFDocument, rgb } from "pdf-lib";
import { FreeTextEdit } from "../../types";
import { BaseOperation } from "../../../core/BaseOperation";

export class AddFreeTextBoxOperation extends BaseOperation<FreeTextEdit> {
  constructor(edit: FreeTextEdit) {
    super(edit);
  }

  async apply(pdfDoc: PDFDocument): Promise<void> {
    const page = pdfDoc.getPage(this.edit.page);

    const {
      text,
      position,
      font,
      color
    } = this.edit;

    // Use default font or embed
    const pdfFont = await pdfDoc.embedFont(font?.family ?? "Helvetica");

    const rgbColor = color
      ? rgb(color.r / 255, color.g / 255, color.b / 255)
      : rgb(0, 0, 0);

    page.drawText(text, {
      x: position.x,
      y: position.y,
      size: font?.size ?? 12,
      font: pdfFont,
      color: rgbColor,
      lineHeight: font?.size ? font.size * 1.2 : 14,
    });
  }
}
