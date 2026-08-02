import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services';
import type { Folder } from '@/types';

export interface UseFoldersResult {
  folders: Folder[];
  isLoading: boolean;
}

/** Reactive view of every registered folder, including empty ones. */
export function useFolders(): UseFoldersResult {
  const folders = useLiveQuery(() => db.folders.toArray(), []);
  return { folders: folders ?? [], isLoading: folders === undefined };
}
