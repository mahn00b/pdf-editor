import { describe, it, expect, vi } from 'vitest';
import { extractTextFromPage } from '..';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

// Mock pdfjs-dist to avoid DOMMatrix error during import
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
}));

// Mock PDFPageProxy
function mockPage(items: Partial<TextItem>[]) {
  return {
    getTextContent: vi.fn().mockResolvedValue({ items }),
  } as any;
}

describe('extractTextFromPage', () => {
  it('extracts text items with bounding boxes and glyph info', async () => {
    const mockItems: Partial<TextItem>[] = [
      {
        str: 'Hello',
        width: 50,
        height: 10,
        transform: [12, 0, 0, 12, 10, 20], // [scaleX, shearX, shearY, scaleY, x, y]
        fontName: 'Helvetica',
      },
      {
        str: 'World',
        width: 60,
        height: 10,
        transform: [12, 0, 0, 12, 70, 20],
        fontName: 'Helvetica',
      },
    ];

    const page = mockPage(mockItems);
    const result = await extractTextFromPage(page);

    expect(result).toHaveLength(2);

    const [first, second] = result;

    expect(first.text).toBe('Hello');
    expect(first.x).toBe(10);
    expect(first.y).toBe(20);
    expect(first.width).toBeGreaterThan(0);
    expect(first.height).toBeGreaterThan(0);
    expect(first.fontName).toBe('Helvetica');
    expect(first.fontSize).toBe(12);

    expect(second.text).toBe('World');
    expect(second.x).toBe(70);
  });

  it('returns empty array for pages with no items', async () => {
    const page = mockPage([]);
    const result = await extractTextFromPage(page);
    expect(result).toEqual([]);
  });
});
