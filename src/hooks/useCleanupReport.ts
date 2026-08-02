import { useMemo } from 'react';
import { buildCleanupReport } from '@/services/cleanupService';
import type { Bookmark, Folder } from '@/types';

export function useCleanupReport(bookmarks: Bookmark[], folders: Folder[]) {
  return useMemo(() => buildCleanupReport(bookmarks, folders), [bookmarks, folders]);
}
