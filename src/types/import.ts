export interface ParsedBookmarkNode {
  title: string;
  url: string;
  originalUrl: string;
  addDate?: number;
  faviconUrl?: string;
  folderPath: string[];
}

export type ImportIssueLevel = 'error' | 'warning';

export interface ImportValidationIssue {
  level: ImportIssueLevel;
  message: string;
  nodeTitle?: string;
  url?: string;
}

export interface ImportPreview {
  fileName: string;
  totalFound: number;
  validBookmarks: ParsedBookmarkNode[];
  issues: ImportValidationIssue[];
  /** Count of parsed bookmarks whose normalized URL already exists in the store. */
  duplicatesWithExisting: number;
}

export interface ImportSummary {
  imported: number;
  skipped: number;
  issues: ImportValidationIssue[];
}
