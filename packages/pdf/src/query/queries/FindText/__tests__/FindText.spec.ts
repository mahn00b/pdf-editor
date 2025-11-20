import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findText } from '..';
import { extractTextFromPage } from '../../../utils';
import type { ExtractedGlyph } from '../../../types';

// Mock extractTextFromPage so we don’t depend on actual pdfjs parsing
vi.mock('../../../utils', () => ({
  extractTextFromPage: vi.fn(),
}));

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn(async (pageNum: number) => ({ id: pageNum })),
    }),
  })),
}));

function createMockGlyphs(text: string, startX = 0, startY = 0): ExtractedGlyph[] {
  return text.split('').map((char, i) => ({
    text: char,
    x: startX + i * 10,
    y: startY,
    width: 10,
    height: 12,
    fontName: 'Helvetica',
    fontSize: 12,
    color: { r: 0, g: 0, b: 0 },
  }));
}

describe('findText', () => {
  const mockGlyphsPage1 = createMockGlyphs('Hello world', 10, 20);
  const mockGlyphsPage2 = createMockGlyphs('Another page of text', 5, 10);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds text across multiple pages', async () => {
    // Arrange
    (extractTextFromPage as any)
      .mockResolvedValueOnce(mockGlyphsPage1)
      .mockResolvedValueOnce(mockGlyphsPage2);

    // Act
    const results = await findText(new ArrayBuffer(10), 'Hello');

    // Assert
    expect(results).toHaveLength(1);
    expect(results[0].page).toBe(1);
    expect(results[0].str).toBe('Hello');
  });

  it('returns multiple matches if text occurs on multiple pages', async () => {
    (extractTextFromPage as any)
      .mockResolvedValueOnce(mockGlyphsPage1)
      .mockResolvedValueOnce(mockGlyphsPage1); // Same content on page 2

    const results = await findText(new ArrayBuffer(10), 'Hello');
    expect(results).toHaveLength(2);
    expect(results.map(r => r.page)).toEqual([1, 2]);
  });

  it('is case-insensitive', async () => {
    (extractTextFromPage as any)
      .mockResolvedValueOnce(mockGlyphsPage1)
      .mockResolvedValueOnce(mockGlyphsPage2);

    const results = await findText(new ArrayBuffer(10), 'hello');
    expect(results.length).toBe(1);
    expect(results[0].str).toBe('Hello'); // Should return original text
  });

  it('returns an empty array if no matches are found', async () => {
    (extractTextFromPage as any)
      .mockResolvedValueOnce(mockGlyphsPage1)
      .mockResolvedValueOnce(mockGlyphsPage2);

    const results = await findText(new ArrayBuffer(10), 'missingtext');
    expect(results).toEqual([]);
  });

  it('handles empty pages gracefully', async () => {
    (extractTextFromPage as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const results = await findText(new ArrayBuffer(10), 'Hello');
    expect(results).toEqual([]);
  });
});
