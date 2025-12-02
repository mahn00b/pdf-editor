import { v4 as uuidv4 } from 'uuid';
import type { PDFDocument } from 'pdf-lib';
import type { SerializableEdit, PdfEdit } from '@types';

export abstract class BaseOperation<TEdit extends PdfEdit> {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly edit: TEdit;

  constructor(serialized: SerializableEdit<TEdit>);
  constructor(edit: TEdit);
  constructor(arg: SerializableEdit<TEdit> | TEdit) {
    if ('edit' in arg && 'id' in arg && 'timestamp' in arg) {
      this.id = arg.id;
      this.timestamp = arg.timestamp;
      this.edit = arg.edit;
    } else {
      this.id = uuidv4();
      this.timestamp = Date.now();
      this.edit = arg as TEdit;
    }
  }

  /** Every operation must implement its own apply logic */
  abstract applyEdit(pdfDoc: PDFDocument): Promise<this>;

  /** Base serialization logic for CRDT tracking */
  serialize(): SerializableEdit<TEdit> {
    return {
      id: this.id,
      type: this.edit.type,
      page: this.edit.page,
      timestamp: this.timestamp,
      edit: this.edit,
    };
  }

  /** Is edit scoped to page? */
  public isPageLevel(): boolean {
    return (
      this.edit.type === 'insert-text' ||
      this.edit.type === 'delete-text' ||
      this.edit.type === 'replace-text' ||
      this.edit.type === 'highlight' ||
      this.edit.type === 'add-sticky-note' ||
      this.edit.type === 'free-text' ||
      this.edit.type === 'redact'
    );
  }

  /** Is edit scoped to entire document? */
  public isDocumentLevel(): boolean {
    return !this.isPageLevel();
  }
}

export default BaseOperation;
