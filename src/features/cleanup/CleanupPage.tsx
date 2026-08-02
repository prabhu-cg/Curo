import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Tabs defaultValue="metadata" className="mx-auto max-w-3xl">
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

      <TabsContent value="metadata" className="mt-4">
        <MissingMetadataTab bookmarks={report.missingMetadata} />
      </TabsContent>

      <TabsContent value="folders" className="mt-4 space-y-4">
        <EmptyFoldersCard folderIds={report.emptyFolders.map((f) => f.id)} />
        <HierarchyIssuesCard issues={report.hierarchyIssues} />
      </TabsContent>

      <TabsContent value="merges" className="mt-4">
        <MergeSuggestionsCard />
      </TabsContent>
    </Tabs>
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

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">
          {bookmarks.length} bookmark{bookmarks.length === 1 ? '' : 's'} need attention
        </CardTitle>
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
      <CardContent className="space-y-1">
        {bookmarks.map(({ bookmark, reasons }) => (
          <Label
            key={bookmark.id}
            className="hover:bg-muted/50 flex items-start gap-3 rounded-md p-2 font-normal"
          >
            <Checkbox
              checked={selected.has(bookmark.id)}
              onCheckedChange={(checked) => toggle(bookmark.id, checked === true)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{bookmark.title}</p>
              <p className="truncate text-xs text-[#555555]">{bookmark.url}</p>
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">
          <FolderX className="mr-1.5 inline size-4" />
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
          <p className="text-sm text-[#555555]">No empty folders found.</p>
        </CardContent>
      ) : (
        <CardContent className="space-y-1">
          {emptyFolders.map((folder) => (
            <Label
              key={folder.id}
              className="hover:bg-muted/50 flex items-center gap-3 rounded-md p-2 font-normal"
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
      <CardHeader>
        <CardTitle className="text-sm">
          <AlertTriangle className="mr-1.5 inline size-4" />
          {issues.length} hierarchy issue{issues.length === 1 ? '' : 's'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {issues.map((issue, i) => (
          <p key={`${issue.folder.id}-${i}`} className="text-sm text-[#555555]">
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
              <p className="text-xs text-[#555555]">{suggestion.reason}</p>
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
