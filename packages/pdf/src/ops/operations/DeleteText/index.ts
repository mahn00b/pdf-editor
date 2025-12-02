import { BaseOperation } from '../../../core/BaseOperation';
import { PDFDocument, rgb } from 'pdf-lib';
import type { DeleteTextEdit, SerializableEdit } from '@types';

export class DeleteTextOperation extends BaseOperation<DeleteTextEdit> {
  static operationType = 'delete-text';

  constructor(serialized: SerializableEdit<DeleteTextEdit>);
  constructor(edit: DeleteTextEdit);
  constructor(arg: SerializableEdit<DeleteTextEdit> | DeleteTextEdit) {
    if ('edit' in arg && 'id' in arg && 'timestamp' in arg) {
      super(arg as SerializableEdit<DeleteTextEdit>);
    } else {
      super(arg as DeleteTextEdit);
    }
  }

  async applyEdit(pdfDoc: PDFDocument): Promise<this> {
    const { page: pageIndex, position, font } = this.edit;
    const page = pdfDoc.getPage(pageIndex);

    const fontSize = font?.size ?? 12;
    const estimatedWidth = (this.edit.oldValue?.length ?? 5) * (fontSize * 0.5);
    const estimatedHeight = fontSize * 1.2;

    page.drawRectangle({
      x: position.x,
      y: position.y - fontSize * 0.25,
      width: estimatedWidth,
      height: estimatedHeight,
      color: rgb(1, 1, 1),
    });

    return this;
  }
}
