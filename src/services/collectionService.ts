import { db } from './db';
import type {
  AutomaticCollectionRule,
  Bookmark,
  Collection,
  CollectionWithCount,
  NewCollectionInput,
} from '@/types';

function createId(): string {
  return crypto.randomUUID();
}

export async function getCustomCollections(): Promise<Collection[]> {
  return db.collections.where('type').equals('custom').toArray();
}

export async function createCollection(input: NewCollectionInput): Promise<Collection> {
  const now = Date.now();
  const collection: Collection = {
    id: createId(),
    name: input.name.trim(),
    description: input.description,
    color: input.color,
    type: 'custom',
    dateCreated: now,
    dateModified: now,
  };
  await db.collections.add(collection);
  return collection;
}

export async function updateCollection(
  id: string,
  update: Partial<Pick<Collection, 'name' | 'description' | 'color'>>,
): Promise<void> {
  await db.collections.update(id, { ...update, dateModified: Date.now() });
}

export async function deleteCollection(id: string): Promise<void> {
  await db.transaction('rw', db.collections, db.bookmarks, async () => {
    await db.collections.delete(id);
    const members = await db.bookmarks.where('collectionIds').equals(id).toArray();
    for (const member of members) {
      await db.bookmarks.update(member.id, {
        collectionIds: member.collectionIds.filter((c) => c !== id),
      });
    }
  });
}

const RECENTLY_ADDED_WINDOW_DAYS = 30;
const TOP_DOMAIN_COLLECTION_COUNT = 8;
const TOP_FOLDER_COLLECTION_COUNT = 8;

function makeAutomaticCollection(
  id: string,
  name: string,
  rule: AutomaticCollectionRule,
): Collection {
  return {
    id,
    name,
    type: 'automatic',
    rule,
    dateCreated: 0,
    dateModified: 0,
  };
}

/**
 * Returns bookmarks belonging to a given collection. Automatic collections
 * are resolved live from their rule; custom collections use explicit
 * membership stored on each bookmark.
 */
export function getBookmarksForCollection(
  collection: Collection,
  allBookmarks: Bookmark[],
): Bookmark[] {
  if (collection.type === 'custom') {
    return allBookmarks.filter((b) => b.collectionIds.includes(collection.id));
  }

  const rule = collection.rule;
  if (!rule) return [];

  switch (rule.kind) {
    case 'domain':
      return allBookmarks.filter((b) => b.domain === rule.domain);
    case 'folder':
      return allBookmarks.filter((b) =>
        rule.folderPath.every((segment, i) => b.folderPath[i] === segment),
      );
    case 'tag':
      return allBookmarks.filter((b) => b.tags.includes(rule.tag));
    case 'favorites':
      return allBookmarks.filter((b) => b.isFavorite);
    case 'recentlyAdded': {
      const cutoff = Date.now() - rule.days * 24 * 60 * 60 * 1000;
      return allBookmarks.filter((b) => b.dateAdded >= cutoff);
    }
    case 'uncategorized':
      return allBookmarks.filter(
        (b) =>
          b.folderPath.length === 0 &&
          b.tags.length === 0 &&
          b.collectionIds.length === 0,
      );
  }
}

/**
 * Computes the standing set of automatic collections (favorites, recently
 * added, uncategorized, plus top domains and top-level folders) from the
 * current bookmark set. These are never persisted — they're derived fresh
 * each time so they always reflect live data.
 */
export function getAutomaticCollections(bookmarks: Bookmark[]): Collection[] {
  const collections: Collection[] = [
    makeAutomaticCollection('auto:favorites', 'Favorites', { kind: 'favorites' }),
    makeAutomaticCollection('auto:recent', 'Recently Added', {
      kind: 'recentlyAdded',
      days: RECENTLY_ADDED_WINDOW_DAYS,
    }),
    makeAutomaticCollection('auto:uncategorized', 'Uncategorized', {
      kind: 'uncategorized',
    }),
  ];

  const domainCounts = new Map<string, number>();
  for (const bookmark of bookmarks) {
    if (!bookmark.domain) continue;
    domainCounts.set(bookmark.domain, (domainCounts.get(bookmark.domain) ?? 0) + 1);
  }
  const topDomains = Array.from(domainCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_DOMAIN_COLLECTION_COUNT);
  for (const [domain] of topDomains) {
    collections.push(
      makeAutomaticCollection(`auto:domain:${domain}`, domain, {
        kind: 'domain',
        domain,
      }),
    );
  }

  const folderCounts = new Map<string, number>();
  for (const bookmark of bookmarks) {
    const topFolder = bookmark.folderPath[0];
    if (!topFolder) continue;
    folderCounts.set(topFolder, (folderCounts.get(topFolder) ?? 0) + 1);
  }
  const topFolders = Array.from(folderCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_FOLDER_COLLECTION_COUNT);
  for (const [folder] of topFolders) {
    collections.push(
      makeAutomaticCollection(`auto:folder:${folder}`, folder, {
        kind: 'folder',
        folderPath: [folder],
      }),
    );
  }

  return collections;
}

export function withCounts(
  collections: Collection[],
  allBookmarks: Bookmark[],
): CollectionWithCount[] {
  return collections.map((collection) => ({
    ...collection,
    bookmarkCount: getBookmarksForCollection(collection, allBookmarks).length,
  }));
}

export async function getAllCollectionsWithCounts(
  allBookmarks: Bookmark[],
): Promise<CollectionWithCount[]> {
  const custom = await getCustomCollections();
  const automatic = getAutomaticCollections(allBookmarks);
  return withCounts([...custom, ...automatic], allBookmarks);
}
