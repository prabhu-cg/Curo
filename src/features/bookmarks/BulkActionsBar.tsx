import { useState } from 'react';
import { FolderPlus, Star, StarOff, Tag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
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
import {
  addBookmarksToCollection,
  addTagsToBookmarks,
  deleteBookmarks,
  toggleFavorite,
} from '@/services/bookmarkService';
import type { CollectionWithCount } from '@/types';

interface BulkActionsBarProps {
  selectedIds: string[];
  customCollections: CollectionWithCount[];
  onDone: () => void;
}

export function BulkActionsBar({
  selectedIds,
  customCollections,
  onDone,
}: BulkActionsBarProps) {
  const [tagInput, setTagInput] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function handleFavorite(isFavorite: boolean) {
    await Promise.all(selectedIds.map((id) => toggleFavorite(id, isFavorite)));
    toast.success(
      `Updated ${selectedIds.length} bookmark${selectedIds.length === 1 ? '' : 's'}`,
    );
    onDone();
  }

  async function handleAddTag() {
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) return;
    await addTagsToBookmarks(selectedIds, tags);
    setTagInput('');
    toast.success('Tags added');
    onDone();
  }

  async function handleAddToCollection(collectionId: string) {
    await addBookmarksToCollection(selectedIds, collectionId);
    toast.success('Added to collection');
    onDone();
  }

  async function handleDelete() {
    await deleteBookmarks(selectedIds);
    setConfirmDeleteOpen(false);
    toast.success(
      `Deleted ${selectedIds.length} bookmark${selectedIds.length === 1 ? '' : 's'}`,
    );
    onDone();
  }

  return (
    <div className="bg-accent text-accent-foreground border-primary/20 flex flex-wrap items-center gap-2 rounded-lg border px-4 py-2.5 text-sm">
      <span className="font-medium">{selectedIds.length} selected</span>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={() => void handleFavorite(true)}>
          <Star /> Favorite
        </Button>
        <Button variant="outline" size="sm" onClick={() => void handleFavorite(false)}>
          <StarOff /> Unfavorite
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Tag /> Add tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void handleAddTag();
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FolderPlus /> Add to collection
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {customCollections.length === 0 && (
              <DropdownMenuItem disabled>No collections yet</DropdownMenuItem>
            )}
            {customCollections.map((collection) => (
              <DropdownMenuItem
                key={collection.id}
                onSelect={() => void handleAddToCollection(collection.id)}
              >
                {collection.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={() => setConfirmDeleteOpen(true)}>
          <Trash2 /> Delete
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Clear selection"
          onClick={onDone}
        >
          <X className="size-4" />
        </Button>
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.length} bookmark{selectedIds.length === 1 ? '' : 's'}?
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
    </div>
  );
}
