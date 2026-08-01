import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services';
import { getAutomaticCollections, withCounts } from '@/services/collectionService';
import type { Bookmark, CollectionWithCount } from '@/types';

export interface UseCollectionsResult {
  collections: CollectionWithCount[];
  customCollections: CollectionWithCount[];
  automaticCollections: CollectionWithCount[];
  isLoading: boolean;
}

/**
 * Reactive view of every collection: custom collections read live from
 * IndexedDB, plus automatic collections re-derived whenever the bookmark set
 * changes. Both are enriched with live bookmark counts.
 */
export function useCollections(bookmarks: Bookmark[]): UseCollectionsResult {
  const customRaw = useLiveQuery(
    () => db.collections.where('type').equals('custom').toArray(),
    [],
  );

  return useMemo(() => {
    const custom = withCounts(customRaw ?? [], bookmarks);
    const automatic = withCounts(getAutomaticCollections(bookmarks), bookmarks);
    return {
      collections: [...custom, ...automatic],
      customCollections: custom,
      automaticCollections: automatic,
      isLoading: customRaw === undefined,
    };
  }, [customRaw, bookmarks]);
}
