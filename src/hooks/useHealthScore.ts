import { useMemo } from 'react';
import { computeHealthScore } from '@/services/healthScoreService';
import type { Bookmark } from '@/types';

export function useHealthScore(bookmarks: Bookmark[]) {
  return useMemo(() => computeHealthScore(bookmarks), [bookmarks]);
}
