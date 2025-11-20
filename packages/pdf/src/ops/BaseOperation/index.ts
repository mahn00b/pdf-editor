// src/ops/BaseOperation.ts
import { v4 as uuidv4 } from 'uuid';
import type { PDFDocument } from 'pdf-lib';
import type { SerializableEdit, PdfEdit } from '../types';

export abstract class BaseOperation<TEdit extends PdfEdit> {
  public readonly id: string;
  public readonly timestamp: number;

  constructor(public readonly edit: TEdit) {
    this.id = uuidv4();
    this.timestamp = Date.now();
  }

  /** Every operation must implement its own apply logic */
  abstract apply(pdfDoc: PDFDocument): Promise<ThisType<this>> | ThisType<this>;

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
}

export default BaseOperation;
