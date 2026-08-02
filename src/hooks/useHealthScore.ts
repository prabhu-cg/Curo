import { useMemo } from 'react';
import { computeHealthScore } from '@/services/healthScoreService';
import type { Bookmark, HealthScoreWeights } from '@/types';

export function useHealthScore(bookmarks: Bookmark[], weights?: HealthScoreWeights) {
  return useMemo(() => computeHealthScore(bookmarks, { weights }), [bookmarks, weights]);
}
