import { Folder } from 'lucide-react';
import { RankList } from './RankList';
import type { FolderCount } from '@/types';

interface FolderRankListProps {
  data: FolderCount[];
  /** Called with the folder's filter value (its full path, or `__unsorted__`) when clicked. */
  onSelect?: (folderValue: string) => void;
}

/** Shortened breadcrumb for a folder path: last two segments, with an ellipsis prefix
 *  when there's more above them — the full path is still available via the tooltip. */
function shortenPath(folderPath: string[]): string {
  if (folderPath.length === 0) return 'Unsorted';
  if (folderPath.length <= 2) return folderPath.join(' / ');
  return `… / ${folderPath.slice(-2).join(' / ')}`;
}

export function FolderRankList({ data, onSelect }: FolderRankListProps) {
  const items = data.map((f) => ({
    id: f.folderPath.length === 0 ? '__unsorted__' : f.folderPath.join(' / '),
    label: shortenPath(f.folderPath),
    fullLabel: f.folderPath.length === 0 ? 'Unsorted' : f.folderPath.join(' / '),
    count: f.count,
  }));

  return (
    <RankList
      data={items}
      icon={Folder}
      onSelect={onSelect}
      emptyMessage="No folders with bookmarks yet."
    />
  );
}
