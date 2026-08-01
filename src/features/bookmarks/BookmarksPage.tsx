import { useMemo, useRef, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Bookmark as BookmarkIcon, Plus, SearchX } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { useBookmarks, useBookmarkSearch, useCollections, useSettings } from '@/hooks';
import { useUiStore } from '@/store/uiStore';
import { getBookmarksForCollection } from '@/services/collectionService';
import { deleteBookmark, toggleFavorite } from '@/services/bookmarkService';
import { createBookmarkColumns } from './columns';
import { BulkActionsBar } from './BulkActionsBar';
import { BookmarkFormDialog } from './BookmarkFormDialog';
import type { Bookmark } from '@/types';

const ROW_HEIGHT_COMFORTABLE = 60;
const ROW_HEIGHT_COMPACT = 44;
const ALL_VALUE = '__all__';

export function BookmarksPage() {
  const { bookmarks, isLoading } = useBookmarks();
  const { collections, customCollections } = useCollections(bookmarks);
  const { settings } = useSettings();
  const rowHeight =
    settings.appearance.density === 'compact'
      ? ROW_HEIGHT_COMPACT
      : ROW_HEIGHT_COMFORTABLE;
  const searchQuery = useUiStore((s) => s.searchQuery);
  const searchResults = useBookmarkSearch(bookmarks, collections, searchQuery);

  const [searchParams, setSearchParams] = useSearchParams();

  const [domainFilter, setDomainFilter] = useState(ALL_VALUE);
  const [tagFilter, setTagFilter] = useState(ALL_VALUE);
  const [collectionFilter, setCollectionFilterState] = useState(
    searchParams.get('collection') ?? ALL_VALUE,
  );
  const setCollectionFilter = (value: string) => {
    setCollectionFilterState(value);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === ALL_VALUE) {
          next.delete('collection');
        } else {
          next.set('collection', value);
        }
        return next;
      },
      { replace: true },
    );
  };
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'dateAdded', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(null);

  const domains = useMemo(
    () => Array.from(new Set(bookmarks.map((b) => b.domain).filter(Boolean))).sort(),
    [bookmarks],
  );
  const tags = useMemo(
    () => Array.from(new Set(bookmarks.flatMap((b) => b.tags))).sort(),
    [bookmarks],
  );

  const baseRows = searchQuery.trim() ? searchResults : bookmarks;

  const collectionMemberIds = useMemo(() => {
    if (collectionFilter === ALL_VALUE) return null;
    const collection = collections.find((c) => c.id === collectionFilter);
    if (!collection) return null;
    return new Set(getBookmarksForCollection(collection, bookmarks).map((b) => b.id));
  }, [collectionFilter, collections, bookmarks]);

  const filteredRows = useMemo(() => {
    return baseRows.filter((b) => {
      if (domainFilter !== ALL_VALUE && b.domain !== domainFilter) return false;
      if (tagFilter !== ALL_VALUE && !b.tags.includes(tagFilter)) return false;
      if (favoritesOnly && !b.isFavorite) return false;
      if (collectionMemberIds && !collectionMemberIds.has(b.id)) return false;
      return true;
    });
  }, [baseRows, domainFilter, tagFilter, favoritesOnly, collectionMemberIds]);

  const columns = useMemo(
    () =>
      createBookmarkColumns({
        onToggleFavorite: (bookmark) => {
          void toggleFavorite(bookmark.id, !bookmark.isFavorite);
        },
        onEdit: (bookmark) => {
          setEditingBookmark(bookmark);
          setFormOpen(true);
        },
        onDelete: (bookmark) => setDeletingBookmark(bookmark),
      }),
    [],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  });

  const rows = table.getRowModel().rows;
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  async function handleConfirmDelete() {
    if (!deletingBookmark) return;
    await deleteBookmark(deletingBookmark.id);
    toast.success('Bookmark deleted');
    setDeletingBookmark(null);
  }

  if (!isLoading && bookmarks.length === 0) {
    return (
      <EmptyState
        icon={BookmarkIcon}
        title="No bookmarks yet"
        description="Import a bookmarks export from your browser, or add your first bookmark manually."
        action={
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/import">Import bookmarks</Link>
            </Button>
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Plus /> Add bookmark
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by domain">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All domains</SelectItem>
            {domains.map((domain) => (
              <SelectItem key={domain} value={domain}>
                {domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-36" aria-label="Filter by tag">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={collectionFilter} onValueChange={setCollectionFilter}>
          <SelectTrigger className="w-44" aria-label="Filter by collection">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All collections</SelectItem>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch
            id="favorites-only"
            checked={favoritesOnly}
            onCheckedChange={setFavoritesOnly}
          />
          <Label htmlFor="favorites-only" className="text-sm font-normal">
            Favorites only
          </Label>
        </div>

        <Button className="ml-auto" onClick={() => setFormOpen(true)}>
          <Plus /> Add bookmark
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedIds={selectedIds}
          customCollections={customCollections}
          onDone={() => setRowSelection({})}
        />
      )}

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No bookmarks match"
          description="Try a different search term or clear your filters."
        />
      ) : (
        <div className="flex-1 overflow-hidden rounded-lg border">
          <div className="bg-muted/50 flex border-b text-xs font-medium text-[#555555]">
            {table.getHeaderGroups()[0]?.headers.map((header) => {
              const label = (
                <>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                </>
              );
              const widthStyle = header.getSize() === 150 ? undefined : header.getSize();
              const flexClass =
                header.column.id === 'title' || header.column.id === 'tags'
                  ? 'flex-1'
                  : '';

              return (
                <div
                  key={header.id}
                  role="columnheader"
                  style={{ width: widthStyle }}
                  className={`flex items-center px-3 py-2 ${flexClass}`}
                >
                  {header.column.getCanSort() ? (
                    <button
                      type="button"
                      className="cursor-pointer select-none focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {label}
                    </button>
                  ) : (
                    label
                  )}
                </div>
              );
            })}
          </div>

          <div ref={scrollRef} className="h-[600px] overflow-auto">
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                return (
                  <div
                    key={row.id}
                    role="row"
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className="hover:bg-muted/40 data-[state=selected]:bg-accent absolute top-0 left-0 flex w-full items-center border-b"
                    style={{
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div
                        key={cell.id}
                        role="cell"
                        style={{
                          width:
                            cell.column.getSize() === 150
                              ? undefined
                              : cell.column.getSize(),
                        }}
                        className={`min-w-0 px-3 ${
                          cell.column.id === 'title' || cell.column.id === 'tags'
                            ? 'flex-1'
                            : ''
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <BookmarkFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingBookmark(undefined);
        }}
        bookmark={editingBookmark}
      />

      <AlertDialog
        open={deletingBookmark !== null}
        onOpenChange={(open) => !open && setDeletingBookmark(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingBookmark?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
