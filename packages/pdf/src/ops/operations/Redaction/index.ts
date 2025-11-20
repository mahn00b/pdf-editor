import { PDFDocument, rgb } from "pdf-lib";
import { RedactionEdit } from "../../types";
import { BaseOperation } from "../../../core/BaseOperation";

export class RedactionOperation extends BaseOperation<RedactionEdit> {
  constructor(edit: RedactionEdit) {
    super(edit);
  }

  async apply(pdfDoc: PDFDocument): Promise<void> {
    const page = pdfDoc.getPage(this.edit.page);

    const { rect } = this.edit;

    // Draw a solid black rectangle to mask content
    page.drawRectangle({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      color: rgb(0, 0, 0),
      borderColor: rgb(0, 0, 0),
      borderWidth: 0,
    });
  }
}
