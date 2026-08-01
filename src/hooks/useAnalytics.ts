import { useMemo } from 'react';
import { buildAnalyticsSnapshot } from '@/services/analyticsService';
import type { AnalyticsSnapshot, Bookmark, CollectionWithCount } from '@/types';

export function useAnalyticsSnapshot(
  bookmarks: Bookmark[],
  collections: CollectionWithCount[],
): AnalyticsSnapshot {
  return useMemo(
    () => buildAnalyticsSnapshot(bookmarks, collections),
    [bookmarks, collections],
  );
}
