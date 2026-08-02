import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import {
  deleteFolder,
  detectBrokenHierarchy,
  detectEmptyFolders,
  getAllFolders,
  mergeFolders,
  registerFolderPaths,
  renameFolder,
  suggestFolderMerges,
} from './folderService';
import type { Bookmark, Folder } from '@/types';

function makeBookmark(overrides: Partial<Bookmark> & Pick<Bookmark, 'id'>): Bookmark {
  return {
    title: 'Example',
    url: `https://example.com/${overrides.id}`,
    originalUrl: `https://example.com/${overrides.id}`,
    domain: 'example.com',
    folderPath: [],
    tags: [],
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
  return {
    id: crypto.randomUUID(),
    dateCreated: Date.now(),
    ...overrides,
  };
}

beforeEach(async () => {
  await db.folders.clear();
  await db.bookmarks.clear();
});

describe('registerFolderPaths', () => {
  it('registers new folder paths and skips ones already known', async () => {
    await registerFolderPaths([['Dev'], ['Dev', 'React']]);
    await registerFolderPaths([['Dev'], ['Dev', 'CSS']]);

    const folders = await getAllFolders();
    const paths = folders.map((f) => f.path.join('/')).sort();
    expect(paths).toEqual(['Dev', 'Dev/CSS', 'Dev/React']);
  });
});

describe('detectEmptyFolders', () => {
  it('flags folders with no bookmark placed directly inside them', () => {
    const devFolder = makeFolder({ path: ['Dev'] });
    const reactFolder = makeFolder({ path: ['Dev', 'React'] });
    const bookmarks = [makeBookmark({ id: '1', folderPath: ['Dev', 'React'] })];

    const empty = detectEmptyFolders([devFolder, reactFolder], bookmarks);
    expect(empty.map((f) => f.id)).toEqual([devFolder.id]);
  });

  it('returns nothing when every folder has a direct bookmark', () => {
    const folder = makeFolder({ path: ['Dev'] });
    const bookmarks = [makeBookmark({ id: '1', folderPath: ['Dev'] })];
    expect(detectEmptyFolders([folder], bookmarks)).toHaveLength(0);
  });
});

describe('detectBrokenHierarchy', () => {
  it('flags a folder whose parent was never registered', () => {
    const orphan = makeFolder({ path: ['Dev', 'React'] });
    const issues = detectBrokenHierarchy([orphan]);
    expect(issues.some((i) => i.type === 'orphaned-parent')).toBe(true);
  });

  it('does not flag a folder whose parent chain is intact', () => {
    const dev = makeFolder({ path: ['Dev'] });
    const react = makeFolder({ path: ['Dev', 'React'] });
    const issues = detectBrokenHierarchy([dev, react]);
    expect(issues).toHaveLength(0);
  });

  it('flags an empty path segment', () => {
    const folder = makeFolder({ path: ['Dev', ''] });
    const issues = detectBrokenHierarchy([folder]);
    expect(issues.some((i) => i.type === 'empty-segment')).toBe(true);
  });

  it('flags duplicate folder rows for the same path', () => {
    const a = makeFolder({ path: ['Dev'] });
    const b = makeFolder({ path: ['Dev'] });
    const issues = detectBrokenHierarchy([a, b]);
    expect(issues.filter((i) => i.type === 'duplicate-path')).toHaveLength(1);
  });
});

describe('suggestFolderMerges', () => {
  it('suggests merging sibling folders with near-identical names', () => {
    const a = makeFolder({ path: ['Dev'], dateCreated: 1 });
    const b = makeFolder({ path: ['dev '], dateCreated: 2 });
    const suggestions = suggestFolderMerges([a, b]);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.suggestedTargetId).toBe(a.id);
  });

  it('does not suggest merging unrelated sibling folders', () => {
    const a = makeFolder({ path: ['Dev'] });
    const b = makeFolder({ path: ['Recipes'] });
    expect(suggestFolderMerges([a, b])).toHaveLength(0);
  });

  it('does not compare folders under different parents', () => {
    const a = makeFolder({ path: ['Work', 'Dev'] });
    const b = makeFolder({ path: ['Personal', 'Dev'] });
    expect(suggestFolderMerges([a, b])).toHaveLength(0);
  });
});

describe('renameFolder', () => {
  it('renames the folder and cascades to descendant folders and bookmarks', async () => {
    await db.folders.bulkAdd([
      makeFolder({ id: 'dev', path: ['Dev'] }),
      makeFolder({ id: 'react', path: ['Dev', 'React'] }),
    ]);
    await db.bookmarks.add(makeBookmark({ id: '1', folderPath: ['Dev', 'React'] }));

    await renameFolder('dev', 'Engineering');

    const folders = await getAllFolders();
    const paths = folders.map((f) => f.path.join('/')).sort();
    expect(paths).toEqual(['Engineering', 'Engineering/React']);

    const bookmark = await db.bookmarks.get('1');
    expect(bookmark?.folderPath).toEqual(['Engineering', 'React']);
  });
});

describe('mergeFolders', () => {
  it('reassigns bookmarks and descendants from source to target, then removes source', async () => {
    await db.folders.bulkAdd([
      makeFolder({ id: 'dev', path: ['Dev'] }),
      makeFolder({ id: 'engineering', path: ['Engineering'] }),
      makeFolder({ id: 'dev-react', path: ['Dev', 'React'] }),
    ]);
    await db.bookmarks.bulkAdd([
      makeBookmark({ id: '1', folderPath: ['Dev'] }),
      makeBookmark({ id: '2', folderPath: ['Dev', 'React'] }),
    ]);

    await mergeFolders('dev', 'engineering');

    const folders = await getAllFolders();
    expect(folders.find((f) => f.id === 'dev')).toBeUndefined();
    const paths = folders.map((f) => f.path.join('/')).sort();
    expect(paths).toEqual(['Engineering', 'Engineering/React']);

    const b1 = await db.bookmarks.get('1');
    const b2 = await db.bookmarks.get('2');
    expect(b1?.folderPath).toEqual(['Engineering']);
    expect(b2?.folderPath).toEqual(['Engineering', 'React']);
  });
});

describe('deleteFolder', () => {
  it('removes the folder row', async () => {
    const folder = makeFolder({ path: ['Dev'] });
    await db.folders.add(folder);
    await deleteFolder(folder.id);
    expect(await db.folders.get(folder.id)).toBeUndefined();
  });
});
