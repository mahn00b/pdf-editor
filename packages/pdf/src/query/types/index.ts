export interface TextQueryResult {
  str: string;
  page: number;
  bbox: { x: number; y: number; width: number; height: number };
  font?: { family: string; size: number };
  kerning?: number[];
}
