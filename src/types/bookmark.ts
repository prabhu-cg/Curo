export type BookmarkSource = 'import' | 'manual';

export interface Bookmark {
  id: string;
  title: string;
  /** Normalized URL used for storage, search, and dedupe. */
  url: string;
  /** URL exactly as it appeared in the source (import or manual entry). */
  originalUrl: string;
  domain: string;
  faviconUrl?: string;
  /** Folder breadcrumb from the imported bookmarks tree, e.g. ["Bookmarks Bar", "Dev"]. */
  folderPath: string[];
  tags: string[];
  /** Custom collection ids this bookmark has been manually added to. */
  collectionIds: string[];
  dateAdded: number;
  dateModified: number;
  notes?: string;
  isFavorite: boolean;
  isArchived: boolean;
  source: BookmarkSource;
}

export type NewBookmarkInput = Pick<Bookmark, 'title' | 'url' | 'folderPath' | 'tags'> &
  Partial<
    Pick<
      Bookmark,
      'faviconUrl' | 'notes' | 'isFavorite' | 'collectionIds' | 'dateAdded' | 'source'
    >
  >;

export type BookmarkUpdate = Partial<Omit<Bookmark, 'id' | 'dateAdded' | 'originalUrl'>>;
