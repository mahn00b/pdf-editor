import { PDFDocument, PDFPage, PDFArray, PDFName, PDFString } from 'pdf-lib';
import { BaseOperation } from '../../../core/BaseOperation';
import type { AddStickyNoteEdit, SerializableEdit } from '@types';

export class AddStickyNoteOperation extends BaseOperation<AddStickyNoteEdit> {
  constructor(serialized: SerializableEdit<AddStickyNoteEdit>);
  constructor(edit: AddStickyNoteEdit);
  constructor(arg: SerializableEdit<AddStickyNoteEdit> | AddStickyNoteEdit) {
    super(arg as any);
  }

  async applyEdit(pdfDoc: PDFDocument): Promise<this> {
    const { page, position, text, icon = 'Note', author, open = false } = this.edit;

    const pdfPage: PDFPage = pdfDoc.getPages()[page] as PDFPage;

    const annotation = {
      Type: 'Annot',
      Subtype: 'Text',
      Contents: PDFString.of(text),
      Rect: [
        position.x,
        position.y,
        position.x + 20,
        position.y + 20,
      ],
      Name: icon,
      T: author ?? undefined,
      Open: open,
    }


    const context = pdfDoc.context.obj(annotation);
    const pageAnnots = pdfPage.node.get(PDFName.of('Annots')) as PDFArray | undefined;

    if (pageAnnots) {
      pageAnnots.push(context);
    } else {
      pdfPage.node.set(
        PDFName.of('Annots'),
        pdfDoc.context.obj([context]),
      );
    }

    return this;
  }
}
