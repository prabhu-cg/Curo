import { findAllDuplicateGroups } from './dedupeService';
import type { Bookmark, HealthScoreBreakdown, HealthScoreFactor } from '@/types';

const STALE_AGE_DAYS = 730;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isOrganized(bookmark: Bookmark): boolean {
  return bookmark.folderPath.length > 0 || bookmark.collectionIds.length > 0;
}

function hasMeaningfulTitle(bookmark: Bookmark): boolean {
  const title = bookmark.title.trim();
  if (!title) return false;
  return title !== bookmark.url && title !== bookmark.domain;
}

/**
 * Computes the Knowledge Health Score: a single composite 0-100 measure of
 * how clean, organized, and well-labeled the bookmark collection is.
 */
export function computeHealthScore(
  bookmarks: Bookmark[],
  now = Date.now(),
): HealthScoreBreakdown {
  const total = bookmarks.length;

  if (total === 0) {
    return { score: 0, factors: [] };
  }

  const duplicateGroups = findAllDuplicateGroups(bookmarks);
  const extraDuplicates = duplicateGroups.reduce(
    (sum, group) => sum + (group.bookmarks.length - 1),
    0,
  );
  const duplicateFreeRate = clamp(100 * (1 - extraDuplicates / total));

  const taggedCount = bookmarks.filter((b) => b.tags.length > 0).length;
  const tagCoverage = clamp((100 * taggedCount) / total);

  const organizedCount = bookmarks.filter(isOrganized).length;
  const organizationRate = clamp((100 * organizedCount) / total);

  const meaningfulTitleCount = bookmarks.filter(hasMeaningfulTitle).length;
  const titleQuality = clamp((100 * meaningfulTitleCount) / total);

  const staleCutoff = now - STALE_AGE_DAYS * 24 * 60 * 60 * 1000;
  const staleCount = bookmarks.filter((b) => b.dateAdded < staleCutoff).length;
  const freshness = clamp(100 * (1 - staleCount / total));

  const factors: HealthScoreFactor[] = [
    {
      key: 'duplicates',
      label: 'Duplicate-free',
      value: duplicateFreeRate,
      weight: 0.25,
      description: `${extraDuplicates} duplicate bookmark${extraDuplicates === 1 ? '' : 's'} found`,
    },
    {
      key: 'organization',
      label: 'Organized',
      value: organizationRate,
      weight: 0.25,
      description: `${organizedCount} of ${total} bookmarks are in a folder or collection`,
    },
    {
      key: 'tags',
      label: 'Tagged',
      value: tagCoverage,
      weight: 0.2,
      description: `${taggedCount} of ${total} bookmarks have at least one tag`,
    },
    {
      key: 'titles',
      label: 'Well-labeled',
      value: titleQuality,
      weight: 0.15,
      description: `${meaningfulTitleCount} of ${total} bookmarks have a descriptive title`,
    },
    {
      key: 'freshness',
      label: 'Fresh',
      value: freshness,
      weight: 0.15,
      description: `${staleCount} bookmark${staleCount === 1 ? '' : 's'} untouched for 2+ years`,
    },
  ];

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = clamp(
    factors.reduce((sum, f) => sum + f.value * f.weight, 0) / totalWeight,
  );

  return { score, factors };
}
