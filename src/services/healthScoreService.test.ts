import { describe, expect, it } from 'vitest';
import { computeHealthScore } from './healthScoreService';
import type { Bookmark } from '@/types';

function makeBookmark(overrides: Partial<Bookmark> & Pick<Bookmark, 'id'>): Bookmark {
  return {
    title: 'A descriptive title',
    url: `https://example.com/${overrides.id}`,
    originalUrl: `https://example.com/${overrides.id}`,
    domain: 'example.com',
    folderPath: ['Dev'],
    tags: ['reference'],
    collectionIds: [],
    dateAdded: Date.now(),
    dateModified: Date.now(),
    isFavorite: false,
    isArchived: false,
    source: 'manual',
    ...overrides,
  };
}

describe('computeHealthScore', () => {
  it('returns a score of 0 with no factors for an empty collection', () => {
    const result = computeHealthScore([]);
    expect(result.score).toBe(0);
    expect(result.factors).toHaveLength(0);
  });

  it('scores a clean, well-organized collection highly', () => {
    const titles = [
      'React Documentation',
      'GitHub',
      'MDN Web Docs',
      'Stack Overflow',
      'Hacker News',
      'TypeScript Handbook',
      'Tailwind CSS',
      'Vercel',
      'Figma',
      'Notion',
    ];
    const bookmarks = titles.map((title, i) =>
      makeBookmark({ id: `${i}`, url: `https://example.com/${i}`, title }),
    );
    const result = computeHealthScore(bookmarks);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it('penalizes duplicates, missing tags, and missing organization', () => {
    const bookmarks = [
      makeBookmark({ id: '1', url: 'https://example.com/dup' }),
      makeBookmark({ id: '2', url: 'https://example.com/dup' }),
      makeBookmark({ id: '3', tags: [], folderPath: [] }),
    ];
    const clean = computeHealthScore(
      Array.from({ length: 3 }, (_, i) => makeBookmark({ id: `clean-${i}` })),
    );
    const messy = computeHealthScore(bookmarks);
    expect(messy.score).toBeLessThan(clean.score);
  });

  it('flags bookmarks whose title is just the URL as low quality', () => {
    const bookmarks = [
      makeBookmark({
        id: '1',
        title: 'https://example.com/1',
        url: 'https://example.com/1',
      }),
    ];
    const result = computeHealthScore(bookmarks);
    const titleFactor = result.factors.find((f) => f.key === 'titles');
    expect(titleFactor?.value).toBe(0);
  });
});
