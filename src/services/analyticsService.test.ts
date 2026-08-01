import { describe, expect, it } from 'vitest';
import {
  getAgeBuckets,
  getDomainDistribution,
  getFolderDistribution,
  getGrowthOverTime,
} from './analyticsService';
import type { Bookmark } from '@/types';

function makeBookmark(overrides: Partial<Bookmark> & Pick<Bookmark, 'id'>): Bookmark {
  return {
    title: 'Example',
    url: `https://example.com/${overrides.id}`,
    originalUrl: `https://example.com/${overrides.id}`,
    domain: 'example.com',
    folderPath: [],
    tags: [],
    collectionIds: [],
    dateAdded: Date.now(),
    dateModified: Date.now(),
    isFavorite: false,
    isArchived: false,
    source: 'manual',
    ...overrides,
  };
}

describe('getDomainDistribution', () => {
  it('counts bookmarks per domain, sorted descending', () => {
    const bookmarks = [
      makeBookmark({ id: '1', domain: 'a.com' }),
      makeBookmark({ id: '2', domain: 'a.com' }),
      makeBookmark({ id: '3', domain: 'b.com' }),
    ];
    const result = getDomainDistribution(bookmarks);
    expect(result[0]).toEqual({ domain: 'a.com', count: 2 });
    expect(result[1]).toEqual({ domain: 'b.com', count: 1 });
  });

  it('buckets domains beyond topN into "Other"', () => {
    const bookmarks = Array.from({ length: 5 }, (_, i) =>
      makeBookmark({ id: `${i}`, domain: `domain-${i}.com` }),
    );
    const result = getDomainDistribution(bookmarks, 2);
    expect(result).toHaveLength(3);
    expect(result[2]?.domain).toBe('Other');
    expect(result[2]?.count).toBe(3);
  });
});

describe('getFolderDistribution', () => {
  it('labels bookmarks with no folder as Unsorted', () => {
    const result = getFolderDistribution([makeBookmark({ id: '1', folderPath: [] })]);
    expect(result[0]?.label).toBe('Unsorted');
  });

  it('joins nested folder paths into a readable label', () => {
    const result = getFolderDistribution([
      makeBookmark({ id: '1', folderPath: ['Dev', 'React'] }),
    ]);
    expect(result[0]?.label).toBe('Dev / React');
  });
});

describe('getAgeBuckets', () => {
  it('places a fresh bookmark in the newest bucket', () => {
    const result = getAgeBuckets([makeBookmark({ id: '1', dateAdded: Date.now() })]);
    expect(result[0]?.label).toBe('< 1 month');
    expect(result[0]?.count).toBe(1);
  });

  it('places an old bookmark in the oldest bucket', () => {
    const threeYearsAgo = Date.now() - 3 * 365 * 24 * 60 * 60 * 1000;
    const result = getAgeBuckets([makeBookmark({ id: '1', dateAdded: threeYearsAgo })]);
    expect(result.at(-1)?.label).toBe('2+ years');
    expect(result.at(-1)?.count).toBe(1);
  });
});

describe('getGrowthOverTime', () => {
  it('produces a cumulative running total sorted chronologically', () => {
    const jan = Date.parse('2024-01-15T00:00:00Z');
    const feb = Date.parse('2024-02-15T00:00:00Z');
    const bookmarks = [
      makeBookmark({ id: '1', dateAdded: jan }),
      makeBookmark({ id: '2', dateAdded: jan }),
      makeBookmark({ id: '3', dateAdded: feb }),
    ];
    const result = getGrowthOverTime(bookmarks);
    expect(result).toEqual([
      { month: '2024-01', count: 2, cumulative: 2 },
      { month: '2024-02', count: 1, cumulative: 3 },
    ]);
  });
});
