import { useMemo } from 'react';
import {
  buildSearchIndex,
  searchBookmarks,
  toSearchable,
} from '@/services/searchService';
import type { Bookmark, Collection } from '@/types';

export function useBookmarkSearch(
  bookmarks: Bookmark[],
  collections: Pick<Collection, 'id' | 'name'>[],
  query: string,
): Bookmark[] {
  const collectionNameById = useMemo(
    () => new Map(collections.map((c) => [c.id, c.name])),
    [collections],
  );

  const index = useMemo(
    () => buildSearchIndex(toSearchable(bookmarks, collectionNameById)),
    [bookmarks, collectionNameById],
  );

  return useMemo(() => searchBookmarks(index, query), [index, query]);
}
