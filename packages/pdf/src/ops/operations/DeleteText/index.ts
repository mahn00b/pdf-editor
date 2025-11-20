// src/ops/text/DeleteTextOperation.ts
import { BaseOperation } from '../../BaseOperation';
import { PDFDocument, rgb } from 'pdf-lib';
import type { DeleteTextEdit } from '../../types';

export class DeleteTextOperation extends BaseOperation<DeleteTextEdit> {
  static operationType = 'delete-text';

  async apply(pdfDoc: PDFDocument): Promise<PDFDocument> {
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

    return pdfDoc;
  }
}
