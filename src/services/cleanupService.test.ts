import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import {
  applyDeleteEmptyFolders,
  applyFolderMergeSuggestion,
  buildCleanupReport,
  detectMissingMetadata,
} from './cleanupService';
import type { Bookmark, Folder } from '@/types';

function makeBookmark(overrides: Partial<Bookmark> & Pick<Bookmark, 'id'>): Bookmark {
  return {
    title: 'A descriptive title',
    url: `https://example.com/${overrides.id}`,
    originalUrl: `https://example.com/${overrides.id}`,
    domain: 'example.com',
    faviconUrl: 'https://example.com/favicon.ico',
    folderPath: [],
    tags: ['reference'],
    collectionIds: [],
    dateAdded: Date.now(),
    dateModified: Date.now(),
    isFavorite: false,
    isArchived: false,
    source: 'manual',
    ...overrides,
  };
}

function makeFolder(overrides: Partial<Folder> & Pick<Folder, 'path'>): Folder {
  return { id: crypto.randomUUID(), dateCreated: Date.now(), ...overrides };
}

beforeEach(async () => {
  await db.folders.clear();
  await db.bookmarks.clear();
});

describe('detectMissingMetadata', () => {
  it('flags a bookmark missing tags, favicon, and a real title, with all reasons', () => {
    const bookmark = makeBookmark({
      id: '1',
      title: 'https://example.com/1',
      faviconUrl: undefined,
      tags: [],
    });
    const issues = detectMissingMetadata([bookmark]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.reasons.sort()).toEqual(['generic-title', 'no-favicon', 'no-tags']);
  });

  it('does not flag a fully-described bookmark', () => {
    const bookmark = makeBookmark({ id: '1' });
    expect(detectMissingMetadata([bookmark])).toHaveLength(0);
  });
});

describe('buildCleanupReport', () => {
  it('aggregates missing metadata, empty folders, hierarchy issues, and merge suggestions', () => {
    const bookmarks = [makeBookmark({ id: '1', tags: [], folderPath: ['Dev'] })];
    const folders = [
      makeFolder({ path: ['Dev'] }),
      makeFolder({ path: ['Dev', 'React'] }), // empty
    ];

    const report = buildCleanupReport(bookmarks, folders);
    expect(report.missingMetadata).toHaveLength(1);
    expect(report.emptyFolders.map((f) => f.path.join('/'))).toEqual(['Dev/React']);
    expect(report.hierarchyIssues).toHaveLength(0);
    expect(report.folderMergeSuggestions).toHaveLength(0);
  });
});

describe('applyDeleteEmptyFolders', () => {
  it('deletes every folder id given', async () => {
    const folders = [makeFolder({ path: ['A'] }), makeFolder({ path: ['B'] })];
    await db.folders.bulkAdd(folders);

    await applyDeleteEmptyFolders(folders.map((f) => f.id));

    expect(await db.folders.count()).toBe(0);
  });
});

describe('applyFolderMergeSuggestion', () => {
  it('merges every non-target folder into the suggested target', async () => {
    const target = makeFolder({ path: ['Dev'] });
    const dupe = makeFolder({ path: ['dev '] });
    await db.folders.bulkAdd([target, dupe]);
    await db.bookmarks.add(makeBookmark({ id: '1', folderPath: ['dev '] }));

    await applyFolderMergeSuggestion({
      id: 'merge:1',
      folders: [target, dupe],
      suggestedTargetId: target.id,
      reason: 'similar names',
    });

    const remaining = await db.folders.toArray();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe(target.id);

    const bookmark = await db.bookmarks.get('1');
    expect(bookmark?.folderPath).toEqual(['Dev']);
  });
});
