import { PDFDocument, rgb } from "pdf-lib";
import { FreeTextEdit, SerializableEdit } from "@types";
import { BaseOperation } from "../../../core/BaseOperation";

export class FreeTextOperation extends BaseOperation<FreeTextEdit> {
  constructor(serialized: SerializableEdit<FreeTextEdit>);
  constructor(edit: FreeTextEdit);
  constructor(arg: SerializableEdit<FreeTextEdit> | FreeTextEdit) {
    if ('edit' in arg && 'id' in arg && 'timestamp' in arg) {
      super(arg as SerializableEdit<FreeTextEdit>);
    } else {
      super(arg as FreeTextEdit);
    }
  }

  async applyEdit(pdfDoc: PDFDocument): Promise<this> {
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

    return this;
  }
}
