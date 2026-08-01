import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services';
import type { Bookmark } from '@/types';

export interface UseBookmarksResult {
  bookmarks: Bookmark[];
  isLoading: boolean;
}

/** Reactive view of every bookmark in the store, live-updating on any change. */
export function useBookmarks(): UseBookmarksResult {
  const bookmarks = useLiveQuery(() => db.bookmarks.toArray(), []);
  return { bookmarks: bookmarks ?? [], isLoading: bookmarks === undefined };
}
