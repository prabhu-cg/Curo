import Dexie, { type Table } from 'dexie';
import type { AppSettings, Bookmark, Collection, Folder } from '@/types';

export class CuroDatabase extends Dexie {
  bookmarks!: Table<Bookmark, string>;
  collections!: Table<Collection, string>;
  settings!: Table<AppSettings, string>;
  folders!: Table<Folder, string>;

  constructor() {
    super('curo');

    const bookmarkColumns = [
      'id',
      'url',
      'domain',
      'dateAdded',
      'dateModified',
      'isFavorite',
      'isArchived',
      '*folderPath',
      '*tags',
      '*collectionIds',
    ].join(', ');

    this.version(1).stores({
      bookmarks: bookmarkColumns,
      collections: 'id, type, name, dateCreated',
      settings: 'id',
    });

    // v2 adds a first-class folders table. Folders were previously implicit
    // (derived only from bookmark.folderPath), so a folder with zero
    // bookmarks couldn't be represented at all — this backfills one row per
    // distinct folder path already in use so upgrading users don't lose
    // their existing (non-empty) folders, and future imports/edits can
    // register genuinely empty ones too.
    this.version(2)
      .stores({
        bookmarks: bookmarkColumns,
        collections: 'id, type, name, dateCreated',
        settings: 'id',
        folders: 'id, *path, dateCreated',
      })
      .upgrade(async (tx) => {
        const bookmarks = await tx.table<Bookmark, string>('bookmarks').toArray();
        const seen = new Set<string>();
        const now = Date.now();
        const folders: Folder[] = [];

        for (const bookmark of bookmarks) {
          for (let i = 1; i <= bookmark.folderPath.length; i++) {
            const path = bookmark.folderPath.slice(0, i);
            const key = path.join('/');
            if (seen.has(key)) continue;
            seen.add(key);
            folders.push({ id: crypto.randomUUID(), path, dateCreated: now });
          }
        }

        if (folders.length > 0) {
          await tx.table<Folder, string>('folders').bulkAdd(folders);
        }
      });
  }
}

export const db = new CuroDatabase();
