import { describe, expect, it } from 'vitest';
import { computeHealthScore, computeInsights } from './healthScoreService';
import type { Bookmark, Folder } from '@/types';

function makeFolder(overrides: Partial<Folder> & Pick<Folder, 'path'>): Folder {
  return { id: crypto.randomUUID(), dateCreated: Date.now(), ...overrides };
}

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

  it('uses custom weights when provided, changing the overall score', () => {
    const bookmarks = [makeBookmark({ id: '1', tags: [] })];
    const tagsHeavy = computeHealthScore(bookmarks, {
      weights: { duplicates: 0, organization: 0, tags: 1, titles: 0, freshness: 0 },
    });
    // Untagged, so a 100%-tags-weighted score should be 0.
    expect(tagsHeavy.score).toBe(0);

    const tagsIgnored = computeHealthScore(bookmarks, {
      weights: { duplicates: 0, organization: 1, tags: 0, titles: 0, freshness: 0 },
    });
    expect(tagsIgnored.score).toBe(100);
  });
});

describe('computeInsights', () => {
  it('returns nothing for an empty collection', () => {
    expect(computeInsights([], [])).toHaveLength(0);
  });

  it('flags duplicates, untagged, generic-title, and uncategorized bookmarks', () => {
    const bookmarks = [
      makeBookmark({ id: '1', url: 'https://example.com/dup', folderPath: [], tags: [] }),
      makeBookmark({ id: '2', url: 'https://example.com/dup', folderPath: [], tags: [] }),
      makeBookmark({
        id: '3',
        title: 'https://example.com/3',
        url: 'https://example.com/3',
        folderPath: [],
        tags: [],
      }),
    ];
    const insights = computeInsights(bookmarks, []);
    const ids = insights.map((i) => i.id);
    expect(ids).toContain('duplicates');
    expect(ids).toContain('tags');
    expect(ids).toContain('titles');
    expect(ids).toContain('uncategorized');
    expect(insights.every((i) => i.actionHref.startsWith('/'))).toBe(true);
  });

  it('flags empty folders and hierarchy issues', () => {
    const bookmarks = [makeBookmark({ id: '1', folderPath: ['Dev'] })];
    const folders = [
      makeFolder({ path: ['Dev'] }),
      makeFolder({ path: ['Dev', 'React'] }),
    ];

    const insights = computeInsights(bookmarks, folders);
    const ids = insights.map((i) => i.id);
    expect(ids).toContain('empty-folders');
  });

  it('sorts more severe insights first', () => {
    const bookmarks = Array.from({ length: 10 }, (_, i) =>
      makeBookmark({ id: `${i}`, tags: i === 0 ? ['x'] : [] }),
    );
    const insights = computeInsights(bookmarks, []);
    const severities = insights.map((i) => i.severity);
    const rank = { critical: 0, warning: 1, info: 2 };
    for (let i = 1; i < severities.length; i++) {
      const current = severities[i];
      const previous = severities[i - 1];
      if (current && previous) {
        expect(rank[current]).toBeGreaterThanOrEqual(rank[previous]);
      }
    }
  });
});
