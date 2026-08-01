import { db } from './db';
import { normalizeUrl } from './urlNormalizer';
import type {
  Bookmark,
  BookmarkUpdate,
  ImportSummary,
  ImportValidationIssue,
  NewBookmarkInput,
  ParsedBookmarkNode,
} from '@/types';

function createId(): string {
  return crypto.randomUUID();
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  return db.bookmarks.toArray();
}

export async function getExistingNormalizedUrls(): Promise<Set<string>> {
  const urls = await db.bookmarks.orderBy('url').keys();
  return new Set(urls as string[]);
}

export async function createBookmark(input: NewBookmarkInput): Promise<Bookmark> {
  const { normalized, domain } = normalizeUrl(input.url);
  const now = Date.now();

  const bookmark: Bookmark = {
    id: createId(),
    title: input.title.trim() || normalized,
    url: normalized,
    originalUrl: input.url,
    domain,
    faviconUrl: input.faviconUrl,
    folderPath: input.folderPath,
    tags: input.tags,
    collectionIds: input.collectionIds ?? [],
    dateAdded: input.dateAdded ?? now,
    dateModified: now,
    notes: input.notes,
    isFavorite: input.isFavorite ?? false,
    isArchived: false,
    source: input.source ?? 'manual',
  };

  await db.bookmarks.add(bookmark);
  return bookmark;
}

export async function updateBookmark(id: string, update: BookmarkUpdate): Promise<void> {
  const patch: BookmarkUpdate & { dateModified: number } = {
    ...update,
    dateModified: Date.now(),
  };

  if (update.url) {
    const { normalized, domain } = normalizeUrl(update.url);
    patch.url = normalized;
    patch.domain = domain;
  }

  await db.bookmarks.update(id, patch);
}

export async function deleteBookmark(id: string): Promise<void> {
  await db.bookmarks.delete(id);
}

export async function deleteBookmarks(ids: string[]): Promise<void> {
  await db.bookmarks.bulkDelete(ids);
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  await db.bookmarks.update(id, { isFavorite, dateModified: Date.now() });
}

export async function addBookmarksToCollection(
  ids: string[],
  collectionId: string,
): Promise<void> {
  await db.transaction('rw', db.bookmarks, async () => {
    for (const id of ids) {
      const existing = await db.bookmarks.get(id);
      if (!existing) continue;
      if (existing.collectionIds.includes(collectionId)) continue;
      await db.bookmarks.update(id, {
        collectionIds: [...existing.collectionIds, collectionId],
        dateModified: Date.now(),
      });
    }
  });
}

export async function removeBookmarksFromCollection(
  ids: string[],
  collectionId: string,
): Promise<void> {
  await db.transaction('rw', db.bookmarks, async () => {
    for (const id of ids) {
      const existing = await db.bookmarks.get(id);
      if (!existing) continue;
      await db.bookmarks.update(id, {
        collectionIds: existing.collectionIds.filter((c) => c !== collectionId),
        dateModified: Date.now(),
      });
    }
  });
}

export async function addTagsToBookmarks(ids: string[], tags: string[]): Promise<void> {
  const normalizedTags = tags.map((t) => t.trim()).filter(Boolean);
  if (normalizedTags.length === 0) return;

  await db.transaction('rw', db.bookmarks, async () => {
    for (const id of ids) {
      const existing = await db.bookmarks.get(id);
      if (!existing) continue;
      const merged = new Set([...existing.tags, ...normalizedTags]);
      await db.bookmarks.update(id, {
        tags: Array.from(merged),
        dateModified: Date.now(),
      });
    }
  });
}

export interface ImportOptions {
  skipInvalidEntries: boolean;
  skipDuplicates: boolean;
}

/**
 * Persists parsed bookmark nodes from an import, normalizing URLs and
 * skipping duplicates of what's already stored when requested.
 */
export async function importParsedBookmarks(
  nodes: ParsedBookmarkNode[],
  issues: ImportValidationIssue[],
  options: ImportOptions,
): Promise<ImportSummary> {
  const existingUrls = await getExistingNormalizedUrls();
  const seenInBatch = new Set<string>();
  const now = Date.now();

  const toInsert: Bookmark[] = [];
  let skipped = 0;
  const runIssues: ImportValidationIssue[] = [...issues];

  for (const node of nodes) {
    const { normalized, domain, isValid } = normalizeUrl(node.url);

    if (!isValid) {
      skipped++;
      runIssues.push({
        level: 'error',
        message: `Skipped unparseable URL "${node.url}".`,
        nodeTitle: node.title,
      });
      continue;
    }

    const isDuplicate = existingUrls.has(normalized) || seenInBatch.has(normalized);
    if (isDuplicate && options.skipDuplicates) {
      skipped++;
      continue;
    }

    seenInBatch.add(normalized);

    toInsert.push({
      id: createId(),
      title: node.title,
      url: normalized,
      originalUrl: node.originalUrl,
      domain,
      faviconUrl: node.faviconUrl,
      folderPath: node.folderPath,
      tags: [],
      collectionIds: [],
      dateAdded: node.addDate ?? now,
      dateModified: now,
      isFavorite: false,
      isArchived: false,
      source: 'import',
    });
  }

  if (toInsert.length > 0) {
    await db.bookmarks.bulkAdd(toInsert);
  }

  return { imported: toInsert.length, skipped, issues: runIssues };
}

export async function clearAllBookmarks(): Promise<void> {
  await db.bookmarks.clear();
}
