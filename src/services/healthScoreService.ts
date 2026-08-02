import { findAllDuplicateGroups } from './dedupeService';
import {
  detectBrokenHierarchy,
  detectEmptyFolders,
  suggestFolderMerges,
} from './folderService';
import type {
  ActionableInsight,
  Bookmark,
  Folder,
  HealthScoreBreakdown,
  HealthScoreFactor,
  HealthScoreWeights,
} from '@/types';

const STALE_AGE_DAYS = 730;

export const DEFAULT_HEALTH_WEIGHTS: HealthScoreWeights = {
  duplicates: 0.25,
  organization: 0.25,
  tags: 0.2,
  titles: 0.15,
  freshness: 0.15,
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isOrganized(bookmark: Bookmark): boolean {
  return bookmark.folderPath.length > 0 || bookmark.collectionIds.length > 0;
}

export function hasMeaningfulTitle(bookmark: Bookmark): boolean {
  const title = bookmark.title.trim();
  if (!title) return false;
  return title !== bookmark.url && title !== bookmark.domain;
}

/**
 * Computes the Knowledge Health Score: a single composite 0-100 measure of
 * how clean, organized, and well-labeled the bookmark collection is. Weights
 * are configurable (see Settings → Health Center) and default to a sensible
 * balanced split.
 */
export function computeHealthScore(
  bookmarks: Bookmark[],
  options: { weights?: HealthScoreWeights; now?: number } = {},
): HealthScoreBreakdown {
  const { weights = DEFAULT_HEALTH_WEIGHTS, now = Date.now() } = options;
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
      weight: weights.duplicates,
      description: `${extraDuplicates} duplicate bookmark${extraDuplicates === 1 ? '' : 's'} found`,
    },
    {
      key: 'organization',
      label: 'Organized',
      value: organizationRate,
      weight: weights.organization,
      description: `${organizedCount} of ${total} bookmarks are in a folder or collection`,
    },
    {
      key: 'tags',
      label: 'Tagged',
      value: tagCoverage,
      weight: weights.tags,
      description: `${taggedCount} of ${total} bookmarks have at least one tag`,
    },
    {
      key: 'titles',
      label: 'Well-labeled',
      value: titleQuality,
      weight: weights.titles,
      description: `${meaningfulTitleCount} of ${total} bookmarks have a descriptive title`,
    },
    {
      key: 'freshness',
      label: 'Fresh',
      value: freshness,
      weight: weights.freshness,
      description: `${staleCount} bookmark${staleCount === 1 ? '' : 's'} untouched for 2+ years`,
    },
  ];

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = clamp(
    factors.reduce((sum, f) => sum + f.value * f.weight, 0) / totalWeight,
  );

  return { score, factors };
}

function insightSeverity(ratio: number): ActionableInsight['severity'] {
  if (ratio >= 0.5) return 'critical';
  if (ratio >= 0.15) return 'warning';
  return 'info';
}

/**
 * Turns the health breakdown and folder hierarchy into a prioritized list of
 * concrete, actionable recommendations, each linking to where to fix it.
 */
export function computeInsights(
  bookmarks: Bookmark[],
  folders: Folder[],
): ActionableInsight[] {
  const insights: ActionableInsight[] = [];
  const total = bookmarks.length;
  if (total === 0) return insights;

  const duplicateGroups = findAllDuplicateGroups(bookmarks);
  const extraDuplicates = duplicateGroups.reduce(
    (sum, group) => sum + (group.bookmarks.length - 1),
    0,
  );
  if (extraDuplicates > 0) {
    insights.push({
      id: 'duplicates',
      title: `${extraDuplicates} duplicate bookmark${extraDuplicates === 1 ? '' : 's'} found`,
      description: 'Merging duplicates keeps your library clean and easier to search.',
      severity: insightSeverity(extraDuplicates / total),
      actionLabel: 'Review duplicates',
      actionHref: '/duplicates',
      count: extraDuplicates,
    });
  }

  const untaggedCount = bookmarks.filter((b) => b.tags.length === 0).length;
  if (untaggedCount > 0) {
    insights.push({
      id: 'tags',
      title: `${untaggedCount} bookmark${untaggedCount === 1 ? '' : 's'} have no tags`,
      description: 'Tags make bookmarks easier to find later with search and filters.',
      severity: insightSeverity(untaggedCount / total),
      actionLabel: 'Review in Cleanup',
      actionHref: '/cleanup',
      count: untaggedCount,
    });
  }

  const genericTitleCount = bookmarks.filter((b) => !hasMeaningfulTitle(b)).length;
  if (genericTitleCount > 0) {
    insights.push({
      id: 'titles',
      title: `${genericTitleCount} bookmark${genericTitleCount === 1 ? '' : 's'} use their URL as the title`,
      description: 'A descriptive title makes a bookmark recognizable at a glance.',
      severity: insightSeverity(genericTitleCount / total),
      actionLabel: 'Review in Cleanup',
      actionHref: '/cleanup',
      count: genericTitleCount,
    });
  }

  const uncategorizedCount = bookmarks.filter((b) => !isOrganized(b)).length;
  if (uncategorizedCount > 0) {
    insights.push({
      id: 'uncategorized',
      title: `${uncategorizedCount} bookmark${uncategorizedCount === 1 ? '' : 's'} are uncategorized`,
      description: 'Not in any folder or collection — easy to lose track of.',
      severity: insightSeverity(uncategorizedCount / total),
      actionLabel: 'View uncategorized',
      actionHref: '/bookmarks?collection=auto:uncategorized',
      count: uncategorizedCount,
    });
  }

  const emptyFolders = detectEmptyFolders(folders, bookmarks);
  if (emptyFolders.length > 0) {
    insights.push({
      id: 'empty-folders',
      title: `${emptyFolders.length} empty folder${emptyFolders.length === 1 ? '' : 's'} found`,
      description: 'These folders have no bookmarks directly inside them.',
      severity: 'info',
      actionLabel: 'Review in Cleanup',
      actionHref: '/cleanup',
      count: emptyFolders.length,
    });
  }

  const hierarchyIssues = detectBrokenHierarchy(folders);
  if (hierarchyIssues.length > 0) {
    insights.push({
      id: 'hierarchy',
      title: `${hierarchyIssues.length} folder hierarchy issue${hierarchyIssues.length === 1 ? '' : 's'}`,
      description: 'Orphaned or duplicate folder paths can make navigation confusing.',
      severity: 'warning',
      actionLabel: 'Review in Cleanup',
      actionHref: '/cleanup',
      count: hierarchyIssues.length,
    });
  }

  const mergeSuggestions = suggestFolderMerges(folders);
  if (mergeSuggestions.length > 0) {
    insights.push({
      id: 'folder-merges',
      title: `${mergeSuggestions.length} folder merge suggestion${mergeSuggestions.length === 1 ? '' : 's'}`,
      description: 'Some folders have very similar names and could be combined.',
      severity: 'info',
      actionLabel: 'Review in Cleanup',
      actionHref: '/cleanup',
      count: mergeSuggestions.length,
    });
  }

  const severityRank: Record<ActionableInsight['severity'], number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  return insights.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
