import { useMemo } from 'react';
import { computeInsights } from '@/services/healthScoreService';
import type { Bookmark, Folder } from '@/types';

export function useHealthInsights(bookmarks: Bookmark[], folders: Folder[]) {
  return useMemo(() => computeInsights(bookmarks, folders), [bookmarks, folders]);
}
