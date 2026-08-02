import { hasMeaningfulTitle } from './healthScoreService';
import {
  deleteFolder,
  detectBrokenHierarchy,
  detectEmptyFolders,
  mergeFolders,
  suggestFolderMerges,
} from './folderService';
import type {
  Bookmark,
  CleanupReport,
  Folder,
  FolderMergeSuggestion,
  MissingMetadataIssue,
  MissingMetadataReason,
} from '@/types';

export function detectMissingMetadata(bookmarks: Bookmark[]): MissingMetadataIssue[] {
  const issues: MissingMetadataIssue[] = [];

  for (const bookmark of bookmarks) {
    const reasons: MissingMetadataReason[] = [];
    if (!hasMeaningfulTitle(bookmark)) reasons.push('generic-title');
    if (!bookmark.faviconUrl) reasons.push('no-favicon');
    if (bookmark.tags.length === 0) reasons.push('no-tags');

    if (reasons.length > 0) {
      issues.push({ bookmark, reasons });
    }
  }

  return issues;
}

/** Combines every cleanup detector into a single report for the Cleanup page. */
export function buildCleanupReport(
  bookmarks: Bookmark[],
  folders: Folder[],
): CleanupReport {
  return {
    missingMetadata: detectMissingMetadata(bookmarks),
    emptyFolders: detectEmptyFolders(folders, bookmarks),
    hierarchyIssues: detectBrokenHierarchy(folders),
    folderMergeSuggestions: suggestFolderMerges(folders),
  };
}

export async function applyDeleteEmptyFolders(folderIds: string[]): Promise<void> {
  for (const id of folderIds) {
    await deleteFolder(id);
  }
}

export async function applyFolderMergeSuggestion(
  suggestion: FolderMergeSuggestion,
): Promise<void> {
  const others = suggestion.folders.filter((f) => f.id !== suggestion.suggestedTargetId);
  for (const folder of others) {
    await mergeFolders(folder.id, suggestion.suggestedTargetId);
  }
}
