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
import { useBookmarks, useDuplicates } from '@/hooks';
import { mergeDuplicateGroup } from '@/services/dedupeService';
import { DuplicateGroupCard } from './DuplicateGroupCard';

export function DuplicatesPage() {
  const { bookmarks } = useBookmarks();
  const allGroups = useDuplicates(bookmarks);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [confirmAutoResolve, setConfirmAutoResolve] = useState(false);

  const groups = useMemo(
    () => allGroups.filter((g) => !dismissedIds.has(g.id)),
    [allGroups, dismissedIds],
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
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {groups.length} duplicate group{groups.length === 1 ? '' : 's'}
          </h2>
          <p className="text-sm text-[#555555]">
            Merging removes {extraCount} redundant bookmark{extraCount === 1 ? '' : 's'}.
          </p>
        </div>
        <Button onClick={() => setConfirmAutoResolve(true)}>
          <Sparkles /> Auto-resolve all
        </Button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
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
