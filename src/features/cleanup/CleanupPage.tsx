import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  FolderX,
  GitMerge,
  Sparkles,
  Tag as TagIcon,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useBookmarks, useCleanupReport, useFolders } from '@/hooks';
import { addTagsToBookmarks, deleteBookmarks } from '@/services/bookmarkService';
import {
  applyDeleteEmptyFolders,
  applyFolderMergeSuggestion,
} from '@/services/cleanupService';
import type { MissingMetadataReason } from '@/types';

const REASON_LABEL: Record<MissingMetadataReason, string> = {
  'generic-title': 'No title',
  'no-favicon': 'No favicon',
  'no-tags': 'No tags',
};

const PAGE_SIZE = 25;

export function CleanupPage() {
  const { bookmarks } = useBookmarks();
  const { folders } = useFolders();
  const report = useCleanupReport(bookmarks, folders);

  const totalIssues =
    report.missingMetadata.length +
    report.emptyFolders.length +
    report.hierarchyIssues.length +
    report.folderMergeSuggestions.length;

  if (bookmarks.length === 0 && folders.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Nothing to clean up yet"
        description="Import or add bookmarks first — Curo will scan them for missing metadata, empty folders, and hierarchy issues."
        action={
          <Button asChild>
            <Link to="/import">Import bookmarks</Link>
          </Button>
        }
      />
    );
  }

  if (totalIssues === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Everything looks clean"
        description="No missing metadata, empty folders, or hierarchy issues were found."
      />
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4">
      <p className="shrink-0 text-sm text-muted-foreground">
        Curo scans your bookmarks for missing metadata, empty folders, and near-duplicate
        folder names. Review each category below and fix what needs attention.
      </p>

      <Tabs defaultValue="metadata" className="min-h-0 flex-1">
        <TabsList>
          <TabsTrigger value="metadata">
            Missing metadata
            {report.missingMetadata.length > 0 && (
              <Badge variant="secondary">{report.missingMetadata.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="folders">
            Folders
            {report.emptyFolders.length + report.hierarchyIssues.length > 0 && (
              <Badge variant="secondary">
                {report.emptyFolders.length + report.hierarchyIssues.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="merges">
            Merge suggestions
            {report.folderMergeSuggestions.length > 0 && (
              <Badge variant="secondary">{report.folderMergeSuggestions.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metadata" className="mt-4 min-h-0 flex-1">
          <MissingMetadataTab bookmarks={report.missingMetadata} />
        </TabsContent>

        <TabsContent value="folders" className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
          <EmptyFoldersCard folderIds={report.emptyFolders.map((f) => f.id)} />
          <HierarchyIssuesCard issues={report.hierarchyIssues} />
        </TabsContent>

        <TabsContent value="merges" className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <MergeSuggestionsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MissingMetadataTab({
  bookmarks,
}: {
  bookmarks: {
    bookmark: { id: string; title: string; url: string };
    reasons: MissingMetadataReason[];
  }[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(bookmarks.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedBookmarks = useMemo(
    () => bookmarks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [bookmarks, currentPage],
  );

  const pageIds = pagedBookmarks.map(({ bookmark }) => bookmark.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected = pageIds.some((id) => selected.has(id));

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllOnPage(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  async function handleAddTags() {
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0 || selected.size === 0) return;
    await addTagsToBookmarks(Array.from(selected), tags);
    setTagInput('');
    setSelected(new Set());
    toast.success('Tags added');
  }

  async function handleDelete() {
    await deleteBookmarks(Array.from(selected));
    setSelected(new Set());
    setConfirmDelete(false);
    toast.success('Bookmarks deleted');
  }

  if (bookmarks.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No missing metadata"
        description="Every bookmark has a title, favicon, and at least one tag."
      />
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Checkbox
            aria-label="Select all on this page"
            checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
            onCheckedChange={(checked) => toggleAllOnPage(checked === true)}
          />
          <CardTitle className="text-sm font-semibold">
            {bookmarks.length} bookmark{bookmarks.length === 1 ? '' : 's'} need attention
          </CardTitle>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                  <TagIcon /> Add tags ({selected.size})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleAddTags();
                  }}
                >
                  <Input
                    placeholder="tag1, tag2"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                  />
                  <Button type="submit" size="sm">
                    Add
                  </Button>
                </form>
              </PopoverContent>
            </Popover>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 /> Delete ({selected.size})
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="divide-border min-h-0 flex-1 divide-y overflow-y-auto p-0">
        {pagedBookmarks.map(({ bookmark, reasons }) => (
          <Label
            key={bookmark.id}
            className={cn(
              'hover:bg-muted/40 flex items-start gap-3 px-(--card-spacing) py-3 font-normal',
              selected.has(bookmark.id) && 'bg-accent',
            )}
          >
            <Checkbox
              checked={selected.has(bookmark.id)}
              onCheckedChange={(checked) => toggle(bookmark.id, checked === true)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{bookmark.title}</p>
              <p className="truncate text-xs text-muted-foreground">{bookmark.url}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {reasons.map((reason) => (
                  <Badge key={reason} variant="secondary" className="text-xs">
                    {REASON_LABEL[reason]}
                  </Badge>
                ))}
              </div>
            </div>
          </Label>
        ))}
      </CardContent>

      {pageCount > 1 && (
        <CardFooter className="shrink-0">
          <Pagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={bookmarks.length}
            onPageChange={setPage}
            itemLabel="bookmarks"
          />
        </CardFooter>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} bookmark{selected.size === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function EmptyFoldersCard({ folderIds }: { folderIds: string[] }) {
  const { folders } = useFolders();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const emptyFolders = folders.filter((f) => folderIds.includes(f.id));

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleDelete() {
    await applyDeleteEmptyFolders(Array.from(selected));
    setSelected(new Set());
    setConfirmDelete(false);
    toast.success('Empty folders deleted');
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <FolderX className="size-4" />
          {emptyFolders.length} empty folder{emptyFolders.length === 1 ? '' : 's'}
        </CardTitle>
        {selected.size > 0 && (
          <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 /> Delete ({selected.size})
          </Button>
        )}
      </CardHeader>
      {emptyFolders.length === 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">No empty folders found.</p>
        </CardContent>
      ) : (
        <CardContent className="divide-border divide-y p-0">
          {emptyFolders.map((folder) => (
            <Label
              key={folder.id}
              className={cn(
                'hover:bg-muted/40 flex items-center gap-3 px-(--card-spacing) py-3 font-normal',
                selected.has(folder.id) && 'bg-accent',
              )}
            >
              <Checkbox
                checked={selected.has(folder.id)}
                onCheckedChange={(checked) => toggle(folder.id, checked === true)}
              />
              <span className="text-sm">{folder.path.join(' / ')}</span>
            </Label>
          ))}
        </CardContent>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} empty folder{selected.size === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This only removes the folder itself — there are no bookmarks in it to lose.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function HierarchyIssuesCard({
  issues,
}: {
  issues: { type: string; message: string; folder: { id: string } }[];
}) {
  if (issues.length === 0) return null;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="size-4" />
          {issues.length} hierarchy issue{issues.length === 1 ? '' : 's'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {issues.map((issue, i) => (
          <p key={`${issue.folder.id}-${i}`} className="text-sm text-muted-foreground">
            {issue.message}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

function MergeSuggestionsCard() {
  const { bookmarks } = useBookmarks();
  const { folders } = useFolders();
  const report = useCleanupReport(bookmarks, folders);

  async function handleMerge(suggestionId: string) {
    const suggestion = report.folderMergeSuggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;
    await applyFolderMergeSuggestion(suggestion);
    toast.success('Folders merged');
  }

  if (report.folderMergeSuggestions.length === 0) {
    return (
      <EmptyState
        icon={GitMerge}
        title="No merge suggestions"
        description="Curo didn't find any sibling folders with very similar names."
      />
    );
  }

  return (
    <div className="space-y-3">
      {report.folderMergeSuggestions.map((suggestion) => (
        <Card key={suggestion.id}>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {suggestion.folders.map((f) => f.path.at(-1)).join(' + ')}
              </p>
              <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
            </div>
            <Button size="sm" onClick={() => void handleMerge(suggestion.id)}>
              <GitMerge /> Merge
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
