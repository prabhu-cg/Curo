import { useMemo } from 'react';
import { findAllDuplicateGroups } from '@/services/dedupeService';
import type { Bookmark } from '@/types';

export function useDuplicates(bookmarks: Bookmark[]) {
  return useMemo(() => findAllDuplicateGroups(bookmarks), [bookmarks]);
}
