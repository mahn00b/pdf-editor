import { BaseOperation } from '../../../core/BaseOperation';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ReplaceTextEdit, SerializableEdit } from '@types';

export class ReplaceTextOperation extends BaseOperation<ReplaceTextEdit> {
  static operationType = 'replace-text';

  constructor(serialized: SerializableEdit<ReplaceTextEdit>);
  constructor(edit: ReplaceTextEdit);
  constructor(arg: SerializableEdit<ReplaceTextEdit> | ReplaceTextEdit) {
    if ('edit' in arg && 'id' in arg && 'timestamp' in arg) {
      super(arg as SerializableEdit<ReplaceTextEdit>);
    } else {
      super(arg as ReplaceTextEdit);
    }
  }

  async applyEdit(pdfDoc: PDFDocument): Promise<this> {
    const { page: pageIndex, newValue, position, font, color = { r: 0, g: 0, b: 0 } } = this.edit;
    const page = pdfDoc.getPage(pageIndex);

    const fontFamily = font?.family ?? StandardFonts.Helvetica;
    const fontSize = font?.size ?? 12;
    const embeddedFont = await pdfDoc.embedFont(fontFamily);

    page.drawText(newValue, {
      x: position.x,
      y: position.y,
      size: fontSize,
      font: embeddedFont,
      color: rgb(color.r, color.g, color.b),
    });

    return this;
  }
}