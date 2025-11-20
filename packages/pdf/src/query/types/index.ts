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
