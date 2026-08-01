import { describe, expect, it } from 'vitest';
import { toCsv, toJson, toMarkdown, toNetscapeHtml } from './exportService';
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
    dateAdded: Date.parse('2024-01-01T00:00:00Z'),
    dateModified: Date.parse('2024-01-01T00:00:00Z'),
    isFavorite: false,
    isArchived: false,
    source: 'manual',
    ...overrides,
  };
}

describe('toNetscapeHtml', () => {
  it('produces a valid Netscape bookmark file with folder structure', () => {
    const bookmarks = [
      makeBookmark({ id: '1', title: 'Root Link', url: 'https://a.com/' }),
      makeBookmark({
        id: '2',
        title: 'Nested Link',
        url: 'https://b.com/',
        folderPath: ['Dev', 'React'],
      }),
    ];

    const html = toNetscapeHtml(bookmarks);
    expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
    expect(html).toContain('<A HREF="https://a.com/"');
    expect(html).toContain('<H3>Dev</H3>');
    expect(html).toContain('<H3>React</H3>');
    expect(html).toContain('<A HREF="https://b.com/"');
  });

  it('flattens folders when includeFolderStructure is false', () => {
    const bookmarks = [makeBookmark({ id: '1', folderPath: ['Dev', 'React'] })];
    const html = toNetscapeHtml(bookmarks, { includeFolderStructure: false });
    expect(html).not.toContain('<H3>');
  });

  it('escapes HTML-sensitive characters in titles and URLs', () => {
    const bookmarks = [
      makeBookmark({ id: '1', title: 'Tom & Jerry <3', url: 'https://a.com/?a=1&b=2' }),
    ];
    const html = toNetscapeHtml(bookmarks);
    expect(html).toContain('Tom &amp; Jerry &lt;3');
    expect(html).toContain('HREF="https://a.com/?a=1&amp;b=2"');
  });
});

describe('toCsv', () => {
  it('produces a CSV header and one row per bookmark', () => {
    const bookmarks = [
      makeBookmark({ id: '1', tags: ['a', 'b'] }),
      makeBookmark({ id: '2', title: 'Second' }),
    ];
    const csv = toCsv(bookmarks);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('title');
    expect(lines[0]).toContain('url');
  });
});

describe('toJson', () => {
  it('round-trips bookmark data losslessly', () => {
    const bookmarks = [makeBookmark({ id: '1', tags: ['a'] })];
    const parsed: Bookmark[] = JSON.parse(toJson(bookmarks));
    expect(parsed).toEqual(bookmarks);
  });
});

describe('toMarkdown', () => {
  it('renders folders as headings and bookmarks as links', () => {
    const bookmarks = [
      makeBookmark({
        id: '1',
        title: 'React Docs',
        url: 'https://react.dev/',
        folderPath: ['Dev'],
      }),
    ];
    const markdown = toMarkdown(bookmarks);
    expect(markdown).toContain('## Dev');
    expect(markdown).toContain('[React Docs](https://react.dev/)');
  });
});
