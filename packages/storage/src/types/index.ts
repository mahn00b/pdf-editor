import type { PdfEdit, SerializableEdit } from "@pdf-editor/pdf";

export interface Document {
  key: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  currentVersion: number;
}

export interface Version {
  id?: number;
  documentId: string;
  version: number;
  isFullSnapshot: boolean;
  compressedData: Uint8Array;
  size: number;
  createdAt: number;
}

export interface OperationRecord<TEdit extends PdfEdit> {
  id?: number;
  documentId: string;
  version: number;
  op: SerializableEdit<TEdit>;
  createdAt: number;
}