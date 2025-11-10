import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findText } from '..';
import { extractTextFromPage } from '../../../utils';
import type { TextQueryResult } from '../../../types';

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

describe('findText', () => {
  const mockTextPage1: TextQueryResult[] = [
    {
      str: 'Hello world',
      page: 1,
      bbox: { x: 10, y: 20, width: 100, height: 12 },
      font: { family: 'Helvetica', size: 12 },
      kerning: [1, 1, 1, 1, 1],
    },
  ];

  const mockTextPage2: TextQueryResult[] = [
    {
      str: 'Another page of text',
      page: 2,
      bbox: { x: 5, y: 10, width: 200, height: 12 },
      font: { family: 'Times', size: 10 },
      kerning: [1, 1, 1, 1],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds text across multiple pages', async () => {
    // Arrange
    (extractTextFromPage as any)
      .mockResolvedValueOnce(mockTextPage1)
      .mockResolvedValueOnce(mockTextPage2);

    // Act
    const results = await findText(new ArrayBuffer(10), 'Hello');

    // Assert
    expect(results).toHaveLength(1);
    expect(results[0].page).toBe(1);
    expect(results[0].str).toContain('Hello');
  });

  it('returns multiple matches if text occurs on multiple pages', async () => {
    const mockMulti: TextQueryResult[] = [
      { ...mockTextPage1[0] },
      { ...mockTextPage1[0], page: 2 },
    ];
    (extractTextFromPage as any)
      .mockResolvedValueOnce([mockMulti[0]])
      .mockResolvedValueOnce([mockMulti[1]]);

    const results = await findText(new ArrayBuffer(10), 'Hello');
    expect(results.map(r => r.page)).toEqual([1, 2]);
  });

  it('is case-insensitive', async () => {
    (extractTextFromPage as any)
      .mockResolvedValueOnce(mockTextPage1)
      .mockResolvedValueOnce(mockTextPage2);

    const results = await findText(new ArrayBuffer(10), 'hello');
    expect(results.length).toBe(1);
  });

  it('returns an empty array if no matches are found', async () => {
    (extractTextFromPage as any)
      .mockResolvedValueOnce(mockTextPage1)
      .mockResolvedValueOnce(mockTextPage2);

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
