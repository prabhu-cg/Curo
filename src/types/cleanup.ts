import type { Bookmark } from './bookmark';
import type { Folder } from './folder';

export type MissingMetadataReason = 'generic-title' | 'no-favicon' | 'no-tags';

export interface MissingMetadataIssue {
  bookmark: Bookmark;
  reasons: MissingMetadataReason[];
}

export type HierarchyIssueType = 'orphaned-parent' | 'empty-segment' | 'duplicate-path';

export interface HierarchyIssue {
  type: HierarchyIssueType;
  folder: Folder;
  message: string;
}

export interface FolderMergeSuggestion {
  id: string;
  folders: Folder[];
  suggestedTargetId: string;
  reason: string;
}

export interface CleanupReport {
  missingMetadata: MissingMetadataIssue[];
  emptyFolders: Folder[];
  hierarchyIssues: HierarchyIssue[];
  folderMergeSuggestions: FolderMergeSuggestion[];
}
