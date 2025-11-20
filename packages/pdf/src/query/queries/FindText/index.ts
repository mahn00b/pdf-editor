import * as pdfjsLib from 'pdfjs-dist';
import { extractTextFromPage } from '../../utils';
import type { TextQueryResult, ExtractedGlyph } from '../../types';

export async function findText(
  pdfData: ArrayBuffer | Uint8Array,
  query: string
): Promise<TextQueryResult[]> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;

  const results: TextQueryResult[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const glyphs = await extractTextFromPage(page);

    // Build full text and map indices back to glyphs
    let fullText = '';
    const textIndexToGlyphIndex: number[] = [];

    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      if (!glyph) continue;
      for (let j = 0; j < glyph.text.length; j++) {
        textIndexToGlyphIndex.push(i);
      }
      fullText += glyph.text;
    }

    // Find all occurrences of query (case-insensitive)
    const lowerQuery = query.toLowerCase();
    const lowerFullText = fullText.toLowerCase();

    if (lowerQuery.length === 0) continue;

    let searchIndex = 0;
    while (true) {
      const matchIndex = lowerFullText.indexOf(lowerQuery, searchIndex);
      if (matchIndex === -1) break;

      // Found a match
      const startGlyphIndex = textIndexToGlyphIndex[matchIndex];
      const endGlyphIndex = textIndexToGlyphIndex[matchIndex + query.length - 1];

      if (startGlyphIndex === undefined || endGlyphIndex === undefined) {
        searchIndex = matchIndex + 1;
        continue;
      }

      // Collect the glyphs for this match
      const matchedGlyphs = glyphs.slice(startGlyphIndex, endGlyphIndex + 1);

      if (matchedGlyphs.length > 0) {
        const firstGlyph = matchedGlyphs[0];
        if (!firstGlyph) {
          searchIndex = matchIndex + query.length;
          continue;
        }

        // Calculate bounding box
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const glyph of matchedGlyphs) {
          if (!glyph) continue;
          minX = Math.min(minX, glyph.x);
          minY = Math.min(minY, glyph.y);
          maxX = Math.max(maxX, glyph.x + glyph.width);
          maxY = Math.max(maxY, glyph.y + glyph.height);
        }

        results.push({
          str: fullText.substring(matchIndex, matchIndex + query.length),
          page: pageNum,
          bbox: {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          },
          font: {
            family: firstGlyph.fontName,
            size: firstGlyph.fontSize,
          },
        });
      }

      searchIndex = matchIndex + query.length;
    }
  }

  await pdf.destroy();

  return results;
}
