import { useMemo, useState } from 'react';
import { CopyCheck, Sparkles } from 'lucide-react';
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
import { Pagination } from '@/components/shared/Pagination';
import { useBookmarks, useDuplicates } from '@/hooks';
import { mergeDuplicateGroup } from '@/services/dedupeService';
import { DuplicateGroupCard } from './DuplicateGroupCard';

const PAGE_SIZE = 25;

export function DuplicatesPage() {
  const { bookmarks } = useBookmarks();
  const allGroups = useDuplicates(bookmarks);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [confirmAutoResolve, setConfirmAutoResolve] = useState(false);
  const [page, setPage] = useState(1);

  const groups = useMemo(
    () => allGroups.filter((g) => !dismissedIds.has(g.id)),
    [allGroups, dismissedIds],
  );

  const pageCount = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedGroups = useMemo(
    () => groups.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [groups, currentPage],
  );

  const extraCount = useMemo(
    () => groups.reduce((sum, g) => sum + (g.bookmarks.length - 1), 0),
    [groups],
  );

  async function handleMerge(groupId: string, canonicalId: string, discardIds: string[]) {
    await mergeDuplicateGroup({ groupId, canonicalId, discardIds });
    toast.success('Duplicates merged');
  }

  async function handleAutoResolveAll() {
    for (const group of groups) {
      const discardIds = group.bookmarks
        .map((b) => b.id)
        .filter((id) => id !== group.suggestedCanonicalId);
      await mergeDuplicateGroup({
        groupId: group.id,
        canonicalId: group.suggestedCanonicalId,
        discardIds,
      });
    }
    setConfirmAutoResolve(false);
    toast.success(
      `Resolved ${groups.length} duplicate group${groups.length === 1 ? '' : 's'}`,
    );
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={CopyCheck}
        title="No duplicates found"
        description="Your library is clean — every bookmark is unique."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Curo groups bookmarks that share the same URL or a near-identical title. Review
        each group below and pick which copy to keep, or auto-resolve everything at once.
      </p>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {groups.length} duplicate group{groups.length === 1 ? '' : 's'}
          </p>
          <p className="text-sm text-muted-foreground">
            Merging removes {extraCount} redundant bookmark{extraCount === 1 ? '' : 's'}.
          </p>
        </div>
        <Button variant="outline" onClick={() => setConfirmAutoResolve(true)}>
          <Sparkles /> Auto-resolve all
        </Button>
      </div>

      <div className="space-y-4">
        {pagedGroups.map((group) => (
          <DuplicateGroupCard
            key={group.id}
            group={group}
            onMerge={(canonicalId, discardIds) =>
              void handleMerge(group.id, canonicalId, discardIds)
            }
            onDismiss={() => setDismissedIds((prev) => new Set(prev).add(group.id))}
          />
        ))}
      </div>

      <Pagination
        className="border-t pt-3"
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={groups.length}
        onPageChange={setPage}
        itemLabel="duplicate groups"
      />

      <AlertDialog open={confirmAutoResolve} onOpenChange={setConfirmAutoResolve}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Auto-resolve {groups.length} duplicate groups?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Curo will keep the most complete bookmark in each group and merge tags and
              collections from the rest, then delete the duplicates. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleAutoResolveAll()}>
              Resolve all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
