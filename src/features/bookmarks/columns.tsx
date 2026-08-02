import { createColumnHelper } from '@tanstack/react-table';
import { Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BookmarkRowActions } from './BookmarkRowActions';
import type { Bookmark } from '@/types';

const columnHelper = createColumnHelper<Bookmark>();

export interface ColumnHandlers {
  onToggleFavorite: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
}

export function createBookmarkColumns(handlers: ColumnHandlers) {
  return [
    columnHelper.display({
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all bookmarks"
          checked={
            table.getIsAllRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(checked) => table.toggleAllRowsSelected(checked === true)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.title}`}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        />
      ),
    }),
    columnHelper.display({
      id: 'favorite',
      size: 40,
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          aria-label={
            row.original.isFavorite ? 'Remove from favorites' : 'Add to favorites'
          }
          aria-pressed={row.original.isFavorite}
          onClick={() => handlers.onToggleFavorite(row.original)}
          className="text-[#555555] hover:text-primary focus-visible:ring-ring rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
        >
          <Star
            className={cn(
              'size-4',
              row.original.isFavorite && 'fill-primary text-primary',
            )}
          />
        </button>
      ),
    }),
    columnHelper.accessor('title', {
      id: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="min-w-0">
          <a
            href={row.original.url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary block truncate text-sm font-medium underline-offset-2 hover:underline"
          >
            {row.original.title}
          </a>
          <p className="truncate text-xs text-[#555555]">{row.original.domain}</p>
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.folderPath.join(' / '), {
      id: 'folder',
      header: 'Folder',
      size: 140,
      cell: ({ row }) => (
        <span className="text-sm text-[#555555]">
          {row.original.folderPath.join(' / ') || '—'}
        </span>
      ),
    }),
    columnHelper.accessor('tags', {
      id: 'tags',
      header: 'Tags',
      enableSorting: false,
      cell: ({ row }) => {
        const tags = row.original.tags;
        if (tags.length === 0) return <span className="text-[#555555]">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        );
      },
    }),
    columnHelper.accessor('dateAdded', {
      id: 'dateAdded',
      header: 'Added',
      size: 110,
      cell: ({ row }) => (
        <span className="text-sm text-[#555555]">
          {new Date(row.original.dateAdded).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      size: 56,
      cell: ({ row }) => (
        <BookmarkRowActions
          bookmark={row.original}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      ),
    }),
  ];
}
