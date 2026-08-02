import Fuse from 'fuse.js';
import { db } from './db';
import type { Bookmark, Folder, FolderMergeSuggestion, HierarchyIssue } from '@/types';

function createId(): string {
  return crypto.randomUUID();
}

function pathKey(path: string[]): string {
  return path.join('/');
}

function startsWith(path: string[], prefix: string[]): boolean {
  if (path.length < prefix.length) return false;
  return prefix.every((segment, i) => path[i] === segment);
}

export async function getAllFolders(): Promise<Folder[]> {
  return db.folders.toArray();
}

/**
 * Registers every folder path from an import (or any other source) that
 * isn't already known, including ones with no bookmarks directly in them —
 * this is what lets genuinely empty folders survive rather than vanishing.
 */
export async function registerFolderPaths(paths: string[][]): Promise<void> {
  if (paths.length === 0) return;

  await db.transaction('rw', db.folders, async () => {
    const existing = await db.folders.toArray();
    const known = new Set(existing.map((f) => pathKey(f.path)));
    const now = Date.now();
    const toAdd: Folder[] = [];

    for (const path of paths) {
      const key = pathKey(path);
      if (known.has(key)) continue;
      known.add(key);
      toAdd.push({ id: createId(), path, dateCreated: now });
    }

    if (toAdd.length > 0) {
      await db.folders.bulkAdd(toAdd);
    }
  });
}

export async function renameFolder(id: string, newName: string): Promise<void> {
  const folder = await db.folders.get(id);
  if (!folder || folder.path.length === 0) return;

  const oldPath = folder.path;
  const newPath = [...oldPath.slice(0, -1), newName.trim()];
  await replacePathPrefix(oldPath, newPath, { includeExactFolder: folder.id });
}

export async function deleteFolder(id: string): Promise<void> {
  await db.folders.delete(id);
}

/**
 * Reassigns every bookmark and descendant folder under `sourceId` to live
 * under `targetId` instead, then removes the now-redundant source folder.
 */
export async function mergeFolders(sourceId: string, targetId: string): Promise<void> {
  const [source, target] = await Promise.all([
    db.folders.get(sourceId),
    db.folders.get(targetId),
  ]);
  if (!source || !target || source.id === target.id) return;

  await replacePathPrefix(source.path, target.path, { excludeFolder: source.id });
  await db.folders.delete(source.id);
}

interface ReplaceOptions {
  /** Also remap this folder's own row (used for rename, where source stays). */
  includeExactFolder?: string;
  /** Never remap this folder's own row (used for merge, where source is deleted after). */
  excludeFolder?: string;
}

async function replacePathPrefix(
  oldPrefix: string[],
  newPrefix: string[],
  options: ReplaceOptions = {},
): Promise<void> {
  await db.transaction('rw', db.folders, db.bookmarks, async () => {
    const bookmarks = await db.bookmarks.toArray();
    for (const bookmark of bookmarks) {
      if (!startsWith(bookmark.folderPath, oldPrefix)) continue;
      const newPath = [...newPrefix, ...bookmark.folderPath.slice(oldPrefix.length)];
      await db.bookmarks.update(bookmark.id, { folderPath: newPath });
    }

    const folders = await db.folders.toArray();
    for (const folder of folders) {
      const isExactMatch = pathKey(folder.path) === pathKey(oldPrefix);
      if (isExactMatch && folder.id !== options.includeExactFolder) continue;
      if (folder.id === options.excludeFolder) continue;
      if (!startsWith(folder.path, oldPrefix)) continue;

      const newPath = [...newPrefix, ...folder.path.slice(oldPrefix.length)];
      if (pathKey(newPath) === pathKey(folder.path)) continue;
      await db.folders.update(folder.id, { path: newPath });
    }
  });
}

/** Folders with no bookmark placed directly inside them (descendants don't count). */
export function detectEmptyFolders(folders: Folder[], bookmarks: Bookmark[]): Folder[] {
  const occupied = new Set(bookmarks.map((b) => pathKey(b.folderPath)));
  return folders.filter((folder) => !occupied.has(pathKey(folder.path)));
}

export function detectBrokenHierarchy(folders: Folder[]): HierarchyIssue[] {
  const issues: HierarchyIssue[] = [];
  const byKey = new Map<string, Folder[]>();

  for (const folder of folders) {
    const key = pathKey(folder.path);
    const bucket = byKey.get(key);
    if (bucket) bucket.push(folder);
    else byKey.set(key, [folder]);

    if (folder.path.some((segment) => segment.trim().length === 0)) {
      issues.push({
        type: 'empty-segment',
        folder,
        message: `"${folder.path.join(' / ') || '(root)'}" has an empty folder name.`,
      });
    }

    if (folder.path.length > 1) {
      const parentKey = pathKey(folder.path.slice(0, -1));
      const hasParent = folders.some((f) => pathKey(f.path) === parentKey);
      if (!hasParent) {
        issues.push({
          type: 'orphaned-parent',
          folder,
          message: `"${folder.path.join(' / ')}" has no registered parent folder.`,
        });
      }
    }
  }

  for (const [, group] of byKey) {
    if (group.length < 2) continue;
    for (const folder of group.slice(1)) {
      issues.push({
        type: 'duplicate-path',
        folder,
        message: `"${folder.path.join(' / ')}" is registered more than once.`,
      });
    }
  }

  return issues;
}

const FOLDER_NAME_SIMILARITY_THRESHOLD = 0.25;

/** Suggests merging sibling folders whose names are near-identical (casing, punctuation, near typos). */
export function suggestFolderMerges(folders: Folder[]): FolderMergeSuggestion[] {
  const byParent = new Map<string, Folder[]>();
  for (const folder of folders) {
    if (folder.path.length === 0) continue;
    const parentKey = pathKey(folder.path.slice(0, -1));
    const bucket = byParent.get(parentKey);
    if (bucket) bucket.push(folder);
    else byParent.set(parentKey, [folder]);
  }

  const suggestions: FolderMergeSuggestion[] = [];

  for (const siblings of byParent.values()) {
    if (siblings.length < 2) continue;

    const indexed = siblings.map((folder) => ({
      folder,
      name: (folder.path.at(-1) ?? '').toLowerCase().trim(),
    }));
    const fuse = new Fuse(indexed, {
      keys: ['name'],
      includeScore: true,
      threshold: FOLDER_NAME_SIMILARITY_THRESHOLD,
    });

    const visited = new Set<string>();
    for (const entry of indexed) {
      if (visited.has(entry.folder.id)) continue;

      const matches = fuse
        .search(entry.name)
        .map((result) => result.item)
        .filter((item) => item.folder.id !== entry.folder.id);

      if (matches.length === 0) continue;

      const group = [entry, ...matches].filter(
        (item, index, arr) =>
          arr.findIndex((x) => x.folder.id === item.folder.id) === index,
      );
      for (const item of group) visited.add(item.folder.id);

      const sortedByAge = [...group].sort(
        (a, b) => a.folder.dateCreated - b.folder.dateCreated,
      );
      const target = sortedByAge[0];
      if (!target) continue;

      suggestions.push({
        id: `merge:${group.map((g) => g.folder.id).join(',')}`,
        folders: group.map((g) => g.folder),
        suggestedTargetId: target.folder.id,
        reason: `These folders have very similar names: ${group.map((g) => `"${g.folder.path.at(-1)}"`).join(', ')}.`,
      });
    }
  }

  return suggestions;
}
