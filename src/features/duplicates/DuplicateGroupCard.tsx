import { useState } from 'react';
import { Link2, Type } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { DuplicateGroup } from '@/types';

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  onMerge: (canonicalId: string, discardIds: string[]) => void;
  onDismiss: () => void;
}

export function DuplicateGroupCard({
  group,
  onMerge,
  onDismiss,
}: DuplicateGroupCardProps) {
  const [canonicalId, setCanonicalId] = useState(group.suggestedCanonicalId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Badge variant="secondary" className="gap-1.5">
          {group.matchType === 'exact-url' ? (
            <>
              <Link2 className="size-3" /> Exact URL match
            </>
          ) : (
            <>
              <Type className="size-3" /> Similar title
            </>
          )}
        </Badge>
        <span className="text-xs text-muted-foreground">{group.bookmarks.length} bookmarks</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={canonicalId} onValueChange={setCanonicalId}>
          {group.bookmarks.map((bookmark) => (
            <Label
              key={bookmark.id}
              htmlFor={`canonical-${bookmark.id}`}
              className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md border p-3 font-normal"
            >
              <RadioGroupItem
                id={`canonical-${bookmark.id}`}
                value={bookmark.id}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium break-words" title={bookmark.title}>
                  {bookmark.title}
                </p>
                <p className="truncate text-xs text-muted-foreground" title={bookmark.url}>
                  {bookmark.url}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {bookmark.folderPath.length > 0 && (
                    <span className="max-w-full truncate" title={bookmark.folderPath.join(' / ')}>
                      {bookmark.folderPath.join(' / ')}
                    </span>
                  )}
                  {bookmark.tags.length > 0 && <span>{bookmark.tags.join(', ')}</span>}
                  <span>{new Date(bookmark.dateAdded).toLocaleDateString()}</span>
                </div>
              </div>
            </Label>
          ))}
        </RadioGroup>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() =>
              onMerge(
                canonicalId,
                group.bookmarks.map((b) => b.id).filter((id) => id !== canonicalId),
              )
            }
          >
            Merge, keep selected
          </Button>
          <Button size="sm" variant="outline" onClick={onDismiss}>
            Not now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
