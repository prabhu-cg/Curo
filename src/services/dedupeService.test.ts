import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import {
  findExactDuplicateGroups,
  findSimilarTitleDuplicates,
  mergeDuplicateGroup,
} from './dedupeService';
import type { Bookmark } from '@/types';

function makeBookmark(overrides: Partial<Bookmark> & Pick<Bookmark, 'id'>): Bookmark {
  return {
    title: 'Untitled',
    url: 'https://example.com/',
    originalUrl: 'https://example.com/',
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

describe('findExactDuplicateGroups', () => {
  it('groups bookmarks that share the exact same normalized URL', () => {
    const bookmarks = [
      makeBookmark({ id: '1', url: 'https://example.com/a' }),
      makeBookmark({ id: '2', url: 'https://example.com/a' }),
      makeBookmark({ id: '3', url: 'https://example.com/b' }),
    ];

    const groups = findExactDuplicateGroups(bookmarks);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.bookmarks.map((b) => b.id).sort()).toEqual(['1', '2']);
  });

  it('prefers the more complete bookmark as the suggested canonical', () => {
    const bookmarks = [
      makeBookmark({ id: '1', url: 'https://example.com/a', tags: [] }),
      makeBookmark({
        id: '2',
        url: 'https://example.com/a',
        tags: ['reference'],
        folderPath: ['Dev'],
      }),
    ];

    const groups = findExactDuplicateGroups(bookmarks);
    expect(groups[0]?.suggestedCanonicalId).toBe('2');
  });

  it('returns no groups when there are no duplicates', () => {
    const bookmarks = [
      makeBookmark({ id: '1', url: 'https://example.com/a' }),
      makeBookmark({ id: '2', url: 'https://example.com/b' }),
    ];
    expect(findExactDuplicateGroups(bookmarks)).toHaveLength(0);
  });
});

describe('findSimilarTitleDuplicates', () => {
  it('flags near-identical titles on the same domain', () => {
    const bookmarks = [
      makeBookmark({
        id: '1',
        url: 'https://example.com/a',
        domain: 'example.com',
        title: 'React Documentation',
      }),
      makeBookmark({
        id: '2',
        url: 'https://example.com/a?ref=x',
        domain: 'example.com',
        title: 'React documentation',
      }),
    ];

    const groups = findSimilarTitleDuplicates(bookmarks, new Set());
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]?.bookmarks.map((b) => b.id).sort()).toEqual(['1', '2']);
  });

  it('does not flag unrelated titles on the same domain', () => {
    const bookmarks = [
      makeBookmark({ id: '1', domain: 'example.com', title: 'Pricing' }),
      makeBookmark({ id: '2', domain: 'example.com', title: 'Contact us' }),
    ];
    expect(findSimilarTitleDuplicates(bookmarks, new Set())).toHaveLength(0);
  });

  it('excludes ids already accounted for by exact matches', () => {
    const bookmarks = [
      makeBookmark({ id: '1', domain: 'example.com', title: 'React Documentation' }),
      makeBookmark({ id: '2', domain: 'example.com', title: 'React documentation' }),
    ];
    expect(findSimilarTitleDuplicates(bookmarks, new Set(['1', '2']))).toHaveLength(0);
  });
});

describe('mergeDuplicateGroup', () => {
  beforeEach(async () => {
    await db.bookmarks.clear();
  });

  it('merges tags and collections into the canonical bookmark and deletes the rest', async () => {
    await db.bookmarks.bulkAdd([
      makeBookmark({ id: 'canonical', tags: ['a'], collectionIds: ['col-1'] }),
      makeBookmark({ id: 'dupe', tags: ['b'], collectionIds: ['col-2'] }),
    ]);

    await mergeDuplicateGroup({
      groupId: 'g1',
      canonicalId: 'canonical',
      discardIds: ['dupe'],
    });

    const remaining = await db.bookmarks.toArray();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe('canonical');
    expect(remaining[0]?.tags.sort()).toEqual(['a', 'b']);
    expect(remaining[0]?.collectionIds.sort()).toEqual(['col-1', 'col-2']);
  });
});
