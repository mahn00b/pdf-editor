import type { TextItem } from 'pdfjs-dist/types/src/display/api';

export interface TextQueryResult {
  str: string;
  page: number;
  bbox: { x: number; y: number; width: number; height: number };
  kerning?: number[];
}

