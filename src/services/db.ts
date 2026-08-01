import Dexie, { type Table } from 'dexie';
import type { AppSettings, Bookmark, Collection } from '@/types';

export class CuroDatabase extends Dexie {
  bookmarks!: Table<Bookmark, string>;
  collections!: Table<Collection, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('curo');

    this.version(1).stores({
      bookmarks: [
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
      ].join(', '),
      collections: 'id, type, name, dateCreated',
      settings: 'id',
    });
  }
}

export const db = new CuroDatabase();
