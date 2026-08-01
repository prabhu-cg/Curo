export type CollectionType = 'custom' | 'automatic';

export type AutomaticCollectionRule =
  | { kind: 'domain'; domain: string }
  | { kind: 'folder'; folderPath: string[] }
  | { kind: 'tag'; tag: string }
  | { kind: 'favorites' }
  | { kind: 'recentlyAdded'; days: number }
  | { kind: 'uncategorized' };

export interface Collection {
  id: string;
  name: string;
  description?: string;
  type: CollectionType;
  color?: string;
  /** Only present for computed automatic collections. */
  rule?: AutomaticCollectionRule;
  dateCreated: number;
  dateModified: number;
}

export type NewCollectionInput = Pick<Collection, 'name'> &
  Partial<Pick<Collection, 'description' | 'color'>>;

/** An automatic or custom collection enriched with its live member count. */
export interface CollectionWithCount extends Collection {
  bookmarkCount: number;
}
