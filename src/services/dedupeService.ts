import Fuse from 'fuse.js';
import { db } from './db';
import type { Bookmark, DuplicateGroup, MergeDecision } from '@/types';

function normalizeTitleForComparison(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Prefers the most complete, oldest entry as the default merge target. */
function pickSuggestedCanonical(bookmarks: Bookmark[]): string {
  const scored = bookmarks.map((bookmark) => {
    let completeness = 0;
    if (bookmark.tags.length > 0) completeness++;
    if (bookmark.folderPath.length > 0) completeness++;
    if (bookmark.notes) completeness++;
    if (bookmark.isFavorite) completeness++;
    return { bookmark, completeness };
  });

  scored.sort((a, b) => {
    if (a.completeness !== b.completeness) return b.completeness - a.completeness;
    return a.bookmark.dateAdded - b.bookmark.dateAdded;
  });

  return scored[0]!.bookmark.id;
}

/** Groups bookmarks that share the exact same normalized URL. */
export function findExactDuplicateGroups(bookmarks: Bookmark[]): DuplicateGroup[] {
  const byUrl = new Map<string, Bookmark[]>();

  for (const bookmark of bookmarks) {
    const bucket = byUrl.get(bookmark.url);
    if (bucket) {
      bucket.push(bookmark);
    } else {
      byUrl.set(bookmark.url, [bookmark]);
    }
  }

  const groups: DuplicateGroup[] = [];
  for (const [url, group] of byUrl) {
    if (group.length < 2) continue;
    groups.push({
      id: `exact:${url}`,
      matchType: 'exact-url',
      key: url,
      bookmarks: group,
      suggestedCanonicalId: pickSuggestedCanonical(group),
    });
  }
  return groups;
}

const SIMILAR_TITLE_THRESHOLD = 0.2;

/**
 * Finds bookmarks on the same domain with near-identical titles that weren't
 * already caught by exact URL matching (e.g. a page bookmarked with and
 * without a query string, or an http/https duplicate).
 */
export function findSimilarTitleDuplicates(
  bookmarks: Bookmark[],
  excludeIds: ReadonlySet<string>,
): DuplicateGroup[] {
  const candidates = bookmarks.filter((b) => !excludeIds.has(b.id));

  const byDomain = new Map<string, Bookmark[]>();
  for (const bookmark of candidates) {
    const bucket = byDomain.get(bookmark.domain);
    if (bucket) {
      bucket.push(bookmark);
    } else {
      byDomain.set(bookmark.domain, [bookmark]);
    }
  }

  const groups: DuplicateGroup[] = [];

  for (const [domain, domainBookmarks] of byDomain) {
    if (domainBookmarks.length < 2 || !domain) continue;

    const indexed = domainBookmarks.map((b) => ({
      ...b,
      normalizedTitle: normalizeTitleForComparison(b.title),
    }));
    const fuse = new Fuse(indexed, {
      keys: ['normalizedTitle'],
      includeScore: true,
      threshold: SIMILAR_TITLE_THRESHOLD,
    });

    const visited = new Set<string>();
    for (const bookmark of indexed) {
      if (visited.has(bookmark.id)) continue;

      const matches = fuse
        .search(bookmark.normalizedTitle)
        .filter((result) => result.item.id !== bookmark.id)
        .map((result) => result.item);

      if (matches.length === 0) continue;

      const groupMembers = [bookmark, ...matches].filter(
        (b, index, arr) => arr.findIndex((x) => x.id === b.id) === index,
      );
      if (groupMembers.length < 2) continue;

      for (const member of groupMembers) visited.add(member.id);

      const plainMembers: Bookmark[] = groupMembers.map(
        ({ normalizedTitle: _normalizedTitle, ...rest }) => rest,
      );

      groups.push({
        id: `title:${domain}:${bookmark.normalizedTitle}`,
        matchType: 'similar-title',
        key: `${domain}:${bookmark.normalizedTitle}`,
        bookmarks: plainMembers,
        suggestedCanonicalId: pickSuggestedCanonical(plainMembers),
      });
    }
  }

  return groups;
}

export function findAllDuplicateGroups(bookmarks: Bookmark[]): DuplicateGroup[] {
  const exactGroups = findExactDuplicateGroups(bookmarks);
  const exactMemberIds = new Set(
    exactGroups.flatMap((group) => group.bookmarks.map((b) => b.id)),
  );
  const similarGroups = findSimilarTitleDuplicates(bookmarks, exactMemberIds);
  return [...exactGroups, ...similarGroups];
}

/**
 * Merges every non-canonical bookmark's tags and collection memberships into
 * the canonical bookmark, then deletes the discarded duplicates.
 */
export async function mergeDuplicateGroup(decision: MergeDecision): Promise<void> {
  await db.transaction('rw', db.bookmarks, async () => {
    const canonical = await db.bookmarks.get(decision.canonicalId);
    if (!canonical) return;

    const mergedTags = new Set(canonical.tags);
    const mergedCollections = new Set(canonical.collectionIds);

    for (const id of decision.discardIds) {
      const discarded = await db.bookmarks.get(id);
      if (!discarded) continue;
      discarded.tags.forEach((t) => mergedTags.add(t));
      discarded.collectionIds.forEach((c) => mergedCollections.add(c));
    }

    await db.bookmarks.update(decision.canonicalId, {
      tags: Array.from(mergedTags),
      collectionIds: Array.from(mergedCollections),
      dateModified: Date.now(),
    });

    await db.bookmarks.bulkDelete(decision.discardIds);
  });
}
