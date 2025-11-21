export interface SerializableEdit<TEdit extends PdfEdit> {
  id: string;
  type: string;
  page: number;
  timestamp: number;
  edit: TEdit;
}

export type PdfEdit =
  | InsertTextEdit
  | ReplaceTextEdit
  | DeleteTextEdit
  | HighlightEdit
  | StickyNoteEdit
  | FreeTextEdit
  | RedactionEdit;

export interface BaseEdit {
  page: number;
  type: string;
}

export interface DeleteTextEdit extends BaseEdit {
  type: 'delete-text';
  oldValue: string; // text to delete (for tracking / undo)
  position: { x: number; y: number };
  font?: {
    family?: string;
    size?: number;
    weight?: string;
    ligatures?: boolean;
  };
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
  color?: { r: number; g: number; b: number };
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
  color?: { r: number; g: number; b: number };
}

export interface RedactionEdit extends BaseEdit {
  type: 'redact';
  rect: { x: number; y: number; width: number; height: number };
}

export interface TextQueryResult {
  str: string;
  page: number;
  bbox: { x: number; y: number; width: number; height: number };
  font?: { family: string; size: number };
  kerning?: number[];
}

export type RGB = { r: number; g: number; b: number };

export interface ExtractedGlyph {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
  color: RGB;
}
