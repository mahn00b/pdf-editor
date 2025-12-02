import { PDFDocument, rgb } from "pdf-lib";
import { RedactionEdit, SerializableEdit } from "@types";
import { BaseOperation } from "../../../core/BaseOperation";

export class RedactionOperation extends BaseOperation<RedactionEdit> {
  constructor(serialized: SerializableEdit<RedactionEdit>);
  constructor(edit: RedactionEdit);
  constructor(arg: SerializableEdit<RedactionEdit> | RedactionEdit) {
    if ('edit' in arg && 'id' in arg && 'timestamp' in arg) {
      super(arg as SerializableEdit<RedactionEdit>);
    } else {
      super(arg as RedactionEdit);
    }
  }

  async applyEdit(pdfDoc: PDFDocument): Promise<this> {
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

    return this;
  }
}
