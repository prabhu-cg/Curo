import { describe, expect, it } from 'vitest';
import { buildSearchIndex, searchBookmarks, toSearchable } from './searchService';
import type { Bookmark } from '@/types';

function makeBookmark(overrides: Partial<Bookmark> & Pick<Bookmark, 'id'>): Bookmark {
  return {
    title: 'Example',
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

describe('search', () => {
  it('finds bookmarks by title', () => {
    const bookmarks = [
      makeBookmark({ id: '1', title: 'React Documentation' }),
      makeBookmark({ id: '2', title: 'Vue Guide' }),
    ];
    const index = buildSearchIndex(toSearchable(bookmarks, new Map()));
    const results = searchBookmarks(index, 'react');
    expect(results.map((b) => b.id)).toEqual(['1']);
  });

  it('finds bookmarks by domain', () => {
    const bookmarks = [
      makeBookmark({ id: '1', domain: 'github.com', url: 'https://github.com/' }),
      makeBookmark({ id: '2', domain: 'gitlab.com', url: 'https://gitlab.com/' }),
    ];
    const index = buildSearchIndex(toSearchable(bookmarks, new Map()));
    const results = searchBookmarks(index, 'github');
    expect(results.map((b) => b.id)).toEqual(['1']);
  });

  it('finds bookmarks by tag', () => {
    const bookmarks = [
      makeBookmark({ id: '1', tags: ['typescript'] }),
      makeBookmark({ id: '2', tags: ['python'] }),
    ];
    const index = buildSearchIndex(toSearchable(bookmarks, new Map()));
    const results = searchBookmarks(index, 'typescript');
    expect(results.map((b) => b.id)).toEqual(['1']);
  });

  it('finds bookmarks by collection name', () => {
    const bookmarks = [makeBookmark({ id: '1', collectionIds: ['col-1'] })];
    const collectionNameById = new Map([['col-1', 'Reading List']]);
    const index = buildSearchIndex(toSearchable(bookmarks, collectionNameById));
    const results = searchBookmarks(index, 'reading list');
    expect(results.map((b) => b.id)).toEqual(['1']);
  });

  it('returns nothing for a blank query', () => {
    const bookmarks = [makeBookmark({ id: '1' })];
    const index = buildSearchIndex(toSearchable(bookmarks, new Map()));
    expect(searchBookmarks(index, '   ')).toHaveLength(0);
  });
});
