import { useState } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { useBookmarks, useCollections } from '@/hooks';
import { deleteCollection } from '@/services/collectionService';
import { CollectionCard } from './CollectionCard';
import { CollectionFormDialog } from './CollectionFormDialog';
import type { CollectionWithCount } from '@/types';

export function CollectionsPage() {
  const { bookmarks } = useBookmarks();
  const { customCollections, automaticCollections } = useCollections(bookmarks);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<
    CollectionWithCount | undefined
  >(undefined);
  const [deletingCollection, setDeletingCollection] =
    useState<CollectionWithCount | null>(null);

  async function handleDelete() {
    if (!deletingCollection) return;
    await deleteCollection(deletingCollection.id);
    toast.success('Collection deleted');
    setDeletingCollection(null);
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">
            Your collections
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setEditingCollection(undefined);
              setFormOpen(true);
            }}
          >
            <Plus /> New collection
          </Button>
        </div>

        {customCollections.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No custom collections yet"
            description="Create a collection to group bookmarks around a topic, project, or goal."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onEdit={(c) => {
                  setEditingCollection(c);
                  setFormOpen(true);
                }}
                onDelete={setDeletingCollection}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase">
          Automatic collections
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {automaticCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      <CollectionFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCollection(undefined);
        }}
        collection={editingCollection}
      />

      <AlertDialog
        open={deletingCollection !== null}
        onOpenChange={(open) => !open && setDeletingCollection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingCollection?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Bookmarks in this collection won't be deleted, only removed from it.
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
    </div>
  );
}
