import type { Bookmark } from './bookmark';

export type DuplicateMatchType = 'exact-url' | 'similar-title';

export interface DuplicateGroup {
  id: string;
  matchType: DuplicateMatchType;
  key: string;
  bookmarks: Bookmark[];
  suggestedCanonicalId: string;
}

export interface MergeDecision {
  groupId: string;
  canonicalId: string;
  /** Ids of non-canonical members to delete after merging their tags/folders/collections. */
  discardIds: string[];
}
