import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { Bookmark as BookmarkIcon, FilterX, Plus, SearchX } from 'lucide-react';
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
import { Pagination } from '@/components/shared/Pagination';
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
const UNSORTED_VALUE = '__unsorted__';
const PAGE_SIZE = 25;

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

  /** Creates state kept in sync with a `?param=` query string value, so other pages
   *  (e.g. Analytics) can deep-link into a pre-filtered bookmarks view. */
  function useQuerySyncedFilter(param: string) {
    const [value, setValueState] = useState(searchParams.get(param) ?? ALL_VALUE);
    const setValue = (next: string) => {
      setValueState(next);
      setPage(1);
      setSearchParams(
        (prev) => {
          const nextParams = new URLSearchParams(prev);
          if (next === ALL_VALUE) nextParams.delete(param);
          else nextParams.set(param, next);
          return nextParams;
        },
        { replace: true },
      );
    };
    return [value, setValue] as const;
  }

  const [page, setPage] = useState(1);
  const [domainFilter, setDomainFilter] = useQuerySyncedFilter('domain');
  const [tagFilter, setTagFilter] = useState(ALL_VALUE);
  const [folderFilter, setFolderFilter] = useQuerySyncedFilter('folder');
  const [collectionFilter, setCollectionFilter] = useQuerySyncedFilter('collection');
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
  const folders = useMemo(
    () =>
      Array.from(
        new Set(bookmarks.map((b) => b.folderPath.join(' / ')).filter(Boolean)),
      ).sort(),
    [bookmarks],
  );
  const hasUnsortedBookmarks = useMemo(
    () => bookmarks.some((b) => b.folderPath.length === 0),
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
      if (folderFilter === UNSORTED_VALUE && b.folderPath.length > 0) return false;
      if (
        folderFilter !== ALL_VALUE &&
        folderFilter !== UNSORTED_VALUE &&
        b.folderPath.join(' / ') !== folderFilter
      )
        return false;
      if (favoritesOnly && !b.isFavorite) return false;
      if (collectionMemberIds && !collectionMemberIds.has(b.id)) return false;
      return true;
    });
  }, [baseRows, domainFilter, tagFilter, folderFilter, favoritesOnly, collectionMemberIds]);

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
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  const hasActiveFilters =
    domainFilter !== ALL_VALUE ||
    tagFilter !== ALL_VALUE ||
    folderFilter !== ALL_VALUE ||
    collectionFilter !== ALL_VALUE ||
    favoritesOnly;

  function handleClearFilters() {
    setDomainFilter(ALL_VALUE);
    setTagFilter(ALL_VALUE);
    setFolderFilter(ALL_VALUE);
    setCollectionFilter(ALL_VALUE);
    setFavoritesOnly(false);
  }

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
      <p className="text-sm text-muted-foreground">
        {filteredRows.length === bookmarks.length
          ? `${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'}`
          : `${filteredRows.length} of ${bookmarks.length} bookmarks`}
      </p>

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

        <Select
          value={tagFilter}
          onValueChange={(value) => {
            setTagFilter(value);
            setPage(1);
          }}
        >
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

        <Select value={folderFilter} onValueChange={setFolderFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by folder">
            <SelectValue placeholder="Folder" />
          </SelectTrigger>
          <SelectContent className="min-w-[22rem] max-w-[28rem]">
            <SelectItem value={ALL_VALUE}>All folders</SelectItem>
            {hasUnsortedBookmarks && (
              <SelectItem value={UNSORTED_VALUE}>Unsorted (no folder)</SelectItem>
            )}
            {folders.map((folder) => (
              <SelectItem key={folder} value={folder} className="whitespace-normal">
                {folder}
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
            onCheckedChange={(checked) => {
              setFavoritesOnly(checked);
              setPage(1);
            }}
          />
          <Label htmlFor="favorites-only" className="text-sm font-normal">
            Favorites only
          </Label>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <FilterX /> Clear filters
          </Button>
        )}

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
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-lg border">
          <div className="bg-muted/50 flex shrink-0 border-b text-xs font-medium text-muted-foreground">
            {table.getHeaderGroups()[0]?.headers.map((header) => {
              const label = (
                <>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                </>
              );
              const isFlexColumn = header.column.id === 'title' || header.column.id === 'tags';
              const widthStyle = isFlexColumn ? undefined : header.getSize();
              const sizingClass = isFlexColumn ? 'min-w-0 flex-1' : 'shrink-0';
              const alignClass =
                header.column.id === 'actions' ? 'justify-center px-2' : 'px-3';

              return (
                <div
                  key={header.id}
                  role="columnheader"
                  style={{ width: widthStyle }}
                  className={`flex items-center py-2 ${sizingClass} ${alignClass}`}
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

          <div className="min-h-0 flex-1 overflow-auto">
            {pagedRows.map((row) => (
              <div
                key={row.id}
                role="row"
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className="hover:bg-muted/40 data-[state=selected]:bg-accent flex w-full items-center border-b"
                style={{ height: rowHeight }}
              >
                {row.getVisibleCells().map((cell) => {
                  const isFlexColumn =
                    cell.column.id === 'title' || cell.column.id === 'tags';
                  const sizingClass = isFlexColumn ? 'min-w-0 flex-1' : 'shrink-0';
                  const alignClass =
                    cell.column.id === 'actions' ? 'flex justify-center px-2' : 'px-3';

                  return (
                    <div
                      key={cell.id}
                      role="cell"
                      style={{ width: isFlexColumn ? undefined : cell.column.getSize() }}
                      className={`${sizingClass} ${alignClass}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="shrink-0 px-3 pb-2">
            <Pagination
              className="border-t pt-3"
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={rows.length}
              onPageChange={setPage}
              itemLabel="bookmarks"
            />
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
