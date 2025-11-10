import * as pdfjsLib from 'pdfjs-dist';
import { extractTextFromPage } from '../../utils';
import type { TextQueryResult } from '../../types';

export async function findText(
  pdfData: ArrayBuffer | Uint8Array,
  query: string
): Promise<TextQueryResult[]> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;

  const results: TextQueryResult[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textItems = await extractTextFromPage(page, pageNum);

    for (const item of textItems) {
      if (item.str.toLowerCase().includes(query.toLowerCase())) {
        results.push(item);
      }
    }
  }

  return results;
}
