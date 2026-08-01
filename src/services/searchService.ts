import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Bookmark } from '@/types';

export interface SearchableBookmark {
  bookmark: Bookmark;
  title: string;
  url: string;
  domain: string;
  folder: string;
  tags: string;
  collections: string;
}

const FUSE_OPTIONS: IFuseOptions<SearchableBookmark> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'url', weight: 0.2 },
    { name: 'domain', weight: 0.15 },
    { name: 'folder', weight: 0.1 },
    { name: 'collections', weight: 0.1 },
    { name: 'tags', weight: 0.05 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export function toSearchable(
  bookmarks: Bookmark[],
  collectionNameById: ReadonlyMap<string, string>,
): SearchableBookmark[] {
  return bookmarks.map((bookmark) => ({
    bookmark,
    title: bookmark.title,
    url: bookmark.url,
    domain: bookmark.domain,
    folder: bookmark.folderPath.join(' / '),
    tags: bookmark.tags.join(' '),
    collections: bookmark.collectionIds
      .map((id) => collectionNameById.get(id))
      .filter((name): name is string => Boolean(name))
      .join(' '),
  }));
}

export function buildSearchIndex(
  searchable: SearchableBookmark[],
): Fuse<SearchableBookmark> {
  return new Fuse(searchable, FUSE_OPTIONS);
}

export function searchBookmarks(
  index: Fuse<SearchableBookmark>,
  query: string,
): Bookmark[] {
  if (!query.trim()) {
    return [];
  }
  return index.search(query).map((result) => result.item.bookmark);
}
