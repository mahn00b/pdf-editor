import { describe, it, expect, vi } from 'vitest';
import { extractTextFromPage } from '..';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

// Mock PDFPageProxy
function mockPage(items: Partial<TextItem>[]) {
  return {
    getTextContent: vi.fn().mockResolvedValue({ items }),
  } as any;
}

describe('extractTextFromPage', () => {
  it('extracts text items with bounding boxes and kerning info', async () => {
    const mockItems: Partial<TextItem>[] = [
      {
        str: 'Hello',
        width: 50,
        transform: [1, 0, 0, -1, 10, 20],
      },
      {
        str: 'World',
        width: 60,
        transform: [1, 0, 0, -1, 70, 20],
      },
    ];

    const page = mockPage(mockItems);
    const result = await extractTextFromPage(page, 1);

    expect(result).toHaveLength(2);

    const [first, second] = result;

    expect(first.str).toBe('Hello');
    expect(first.page).toBe(1);
    expect(first.bbox.x).toBe(10);
    expect(first.bbox.y).toBe(20);
    expect(first.bbox.width).toBeGreaterThan(0);
    expect(first.kerning?.length).toBe('Hello'.length);

    expect(second.str).toBe('World');
  });

  it('returns empty array for pages with no items', async () => {
    const page = mockPage([]);
    const result = await extractTextFromPage(page, 2);
    expect(result).toEqual([]);
  });
});
