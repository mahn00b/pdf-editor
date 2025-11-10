import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { TextQueryResult } from './types';

export async function extractTextFromPage(
  page: pdfjsLib.PDFPageProxy,
  pageNumber: number
): Promise<TextQueryResult[]> {
  const content = await page.getTextContent();
  const texts: TextQueryResult[] = [];

  for (const item of content.items as TextItem[]) {
    const [a, b, c, d, e, f] = item.transform;
    const scaleX = Math.sqrt(a * a + b * b);
    const width = item.width * scaleX;
    const height = Math.abs(d);
    const x = e;
    const y = f;

    texts.push({
      str: item.str,
      page: pageNumber,
      bbox: { x, y, width, height },
      kerning: approximateKerning(item),
    });
  }

  return texts;
}

function approximateKerning(item: TextItem): number[] {
  const [a, b] = item.transform;
  const scaleX = Math.sqrt(a * a + b * b);
  const totalWidth = item.width * scaleX;
  const charCount = item.str.length;

  if (charCount <= 1) return [0];

  const avg = totalWidth / charCount;
  return new Array(charCount).fill(avg);
}