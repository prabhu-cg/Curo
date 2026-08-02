export interface Folder {
  id: string;
  /** Breadcrumb path, e.g. ["Bookmarks Bar", "Dev", "React"]. */
  path: string[];
  dateCreated: number;
}

export type NewFolderInput = Pick<Folder, 'path'>;
