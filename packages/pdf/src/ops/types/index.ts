export interface SerializableEdit<TEdit extends PdfEdit> {
  id: string;
  type: string;
  timestamp: number;
  edit: TEdit;
}

export type PdfEdit =
  | TextEdit
  | InsertTextEdit
  | HighlightEdit
  | StickyNoteEdit
  | FreeTextEdit
  | RedactionEdit;

export interface BaseEdit {
  page: number;
  type: string;
}

export interface TextEdit extends BaseEdit {
  type: 'text';
  action: 'insert' | 'delete' | 'replace';
  oldValue?: string;       // original text (for replace/delete)
  newValue?: string;       // new text (for insert/replace)
  position: { x: number; y: number }; // approximate coordinates
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
