export interface SerializableEdit<TEdit extends PdfEdit> {
  id: string;
  type: string;
  timestamp: number;
  edit: TEdit;
}

export type PdfEdit =
  | InsertTextEdit
  | ReplaceTextEdit
  | HighlightEdit
  | StickyNoteEdit
  | FreeTextEdit
  | RedactionEdit;

export interface BaseEdit {
  page: number;
  type: string;
}

export interface ReplaceTextEdit extends BaseEdit {
  type: 'replace-text';
  oldValue: string;
  newValue: string;
  color?: { r: number; g: number; b: number };
  position: { x: number; y: number };
  font?: {
    family?: string;
    size?: number;
    weight?: string;
    ligatures?: boolean;
  };
}

export interface InsertTextEdit extends BaseEdit {
  type: 'insert-text';
  value: string;
  position: { x: number; y: number };
  font?: {
    family?: string;
    size?: number;
    weight?: string;
    ligatures?: boolean;
  };
  color?: { r: number; g: number; b: number };
}

export interface HighlightEdit extends BaseEdit {
  type: 'highlight';
  rect: { x: number; y: number; width: number; height: number };
  color?: string;
}

export interface StickyNoteEdit extends BaseEdit {
  type: 'note';
  text: string;
  position: { x: number; y: number };
}

export interface FreeTextEdit extends BaseEdit {
  type: 'freeText';
  text: string;
  position: { x: number; y: number };
  font?: { family?: string; size?: number; weight?: string };
}

export interface RedactionEdit extends BaseEdit {
  type: 'redact';
  rect: { x: number; y: number; width: number; height: number };
}
