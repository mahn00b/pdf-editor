import { getDocument, PDFPageProxy, AnnotationType } from 'pdfjs-dist';
import type { TextContent, TextItem, } from 'pdfjs-dist/types/src/display/api';
type RGB = { r: number; g: number; b: number };

interface ExtractedGlyph {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
  color: RGB;
}

/**
 * Computes the transformed glyph width and height using vector magnitudes.
 */
function computeGlyphBox(item: TextItem) {
  const [scaleX, shearX, shearY, scaleY] = item.transform;
  const width = item.width * Math.sqrt(scaleX ** 2 + shearX ** 2);
  const height = item.height * Math.sqrt(shearY ** 2 + scaleY ** 2);
  return { width, height };
}

/**
 * Extracts text color from the PDF graphics state as RGB.
 * (PDF.js provides this via `item.color` or `item.fillColor`, depending on version)
 */
function getTextColor(item: any): RGB {
  const color = item.color || item.fillColor;
  if (!color) return { r: 0, g: 0, b: 0 }; // default to black
  const [r, g, b] = color.length === 3 ? color : [0, 0, 0];
  return { r, g, b };
}

/**
 * Extracts structured text data (glyphs) from a single PDF page.
 */
async function extractTextFromPage(page: PDFPageProxy): Promise<ExtractedGlyph[]> {
  const textContent: TextContent = await page.getTextContent();
  const annos = await page.getAnnotations();
  const glyphs: ExtractedGlyph[] = [];

  for (const item of textContent.items) {
    if (!('str' in item)) continue;

    const [,,,, x, y] = item.transform;
    const { width, height } = computeGlyphBox(item);
    const color = getTextColor(item);
    const fontName = item.fontName || 'unknown';
    const fontSize = item.transform[0]; // often approximate, may refine later

    glyphs.push({
      text: item.str,
      x,
      y,
      width,
      height,
      fontName,
      fontSize,
      color,
    });
  }

  return glyphs;
}

/**
 * Extracts text content from the entire document.
 */
export async function extractTextFromDoc(pdfBuffer: ArrayBuffer): Promise<ExtractedGlyph[]> {
  const pdf = await getDocument({ data: pdfBuffer }).promise;
  const allGlyphs: ExtractedGlyph[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const pageGlyphs = await extractTextFromPage(page);
    allGlyphs.push(...pageGlyphs);
  }

  return allGlyphs;
}


function getHighlightColor(annotation: any): RGB {
  const color = annotation.color || annotation.c || [1, 1, 0]; // default: yellow

  const [r, g, b] = color.length === 3
    ? color.map((c: number) => Math.round(c * 255))
    : [255, 255, 0];

  return { r, g, b };
}
