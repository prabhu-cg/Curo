import type {
  AgeBucket,
  AnalyticsSnapshot,
  Bookmark,
  CollectionCount,
  CollectionWithCount,
  DomainCount,
  FolderCount,
  GrowthPoint,
} from '@/types';

const TOP_DOMAINS = 10;
const TOP_FOLDERS = 10;

export function getDomainDistribution(
  bookmarks: Bookmark[],
  topN = TOP_DOMAINS,
): DomainCount[] {
  const counts = new Map<string, number>();
  for (const bookmark of bookmarks) {
    if (!bookmark.domain) continue;
    counts.set(bookmark.domain, (counts.get(bookmark.domain) ?? 0) + 1);
  }

  const sorted = Array.from(counts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);

  if (sorted.length <= topN) return sorted;

  const top = sorted.slice(0, topN);
  const otherCount = sorted.slice(topN).reduce((sum, d) => sum + d.count, 0);
  return [...top, { domain: 'Other', count: otherCount }];
}

export function getFolderDistribution(
  bookmarks: Bookmark[],
  topN = TOP_FOLDERS,
): FolderCount[] {
  const counts = new Map<string, { folderPath: string[]; count: number }>();

  for (const bookmark of bookmarks) {
    const key = bookmark.folderPath.length > 0 ? bookmark.folderPath.join(' / ') : '';
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, { folderPath: bookmark.folderPath, count: 1 });
    }
  }

  return Array.from(counts.values())
    .map(({ folderPath, count }) => ({
      folderPath,
      label: folderPath.length > 0 ? folderPath.join(' / ') : 'Unsorted',
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

export function getCollectionDistribution(
  collections: CollectionWithCount[],
): CollectionCount[] {
  return collections
    .map((c) => ({ collectionId: c.id, name: c.name, count: c.bookmarkCount }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

const AGE_BUCKET_DEFINITIONS: { label: string; maxDays: number }[] = [
  { label: '< 1 month', maxDays: 30 },
  { label: '1-3 months', maxDays: 90 },
  { label: '3-6 months', maxDays: 182 },
  { label: '6-12 months', maxDays: 365 },
  { label: '1-2 years', maxDays: 730 },
  { label: '2+ years', maxDays: Infinity },
];

export function getAgeBuckets(bookmarks: Bookmark[], now = Date.now()): AgeBucket[] {
  const buckets = AGE_BUCKET_DEFINITIONS.map((def) => ({ label: def.label, count: 0 }));

  for (const bookmark of bookmarks) {
    const ageDays = (now - bookmark.dateAdded) / (24 * 60 * 60 * 1000);
    const bucketIndex = AGE_BUCKET_DEFINITIONS.findIndex((def) => ageDays <= def.maxDays);
    const target = buckets[bucketIndex === -1 ? buckets.length - 1 : bucketIndex];
    if (target) target.count++;
  }

  return buckets;
}

export function getGrowthOverTime(bookmarks: Bookmark[]): GrowthPoint[] {
  const counts = new Map<string, number>();
  for (const bookmark of bookmarks) {
    const date = new Date(bookmark.dateAdded);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }

  const months = Array.from(counts.keys()).sort();
  let cumulative = 0;
  return months.map((month) => {
    const count = counts.get(month) ?? 0;
    cumulative += count;
    return { month, count, cumulative };
  });
}

export function buildAnalyticsSnapshot(
  bookmarks: Bookmark[],
  collections: CollectionWithCount[],
): AnalyticsSnapshot {
  return {
    totalBookmarks: bookmarks.length,
    domains: getDomainDistribution(bookmarks),
    folders: getFolderDistribution(bookmarks),
    collections: getCollectionDistribution(collections),
    ageBuckets: getAgeBuckets(bookmarks),
    growth: getGrowthOverTime(bookmarks),
  };
}
