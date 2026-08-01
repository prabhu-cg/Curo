import {
  Clock,
  Folder,
  Globe,
  HelpCircle,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AutomaticCollectionRule, CollectionWithCount } from '@/types';

function CollectionIcon({
  type,
  rule,
}: {
  type: CollectionWithCount['type'];
  rule: AutomaticCollectionRule | undefined;
}) {
  const className = 'size-4 text-[#555555]';
  if (type === 'custom') return <Folder className={className} aria-hidden="true" />;

  switch (rule?.kind) {
    case 'favorites':
      return <Star className={className} aria-hidden="true" />;
    case 'recentlyAdded':
      return <Clock className={className} aria-hidden="true" />;
    case 'domain':
      return <Globe className={className} aria-hidden="true" />;
    case 'folder':
      return <Folder className={className} aria-hidden="true" />;
    default:
      return <HelpCircle className={className} aria-hidden="true" />;
  }
}

interface CollectionCardProps {
  collection: CollectionWithCount;
  onEdit?: (collection: CollectionWithCount) => void;
  onDelete?: (collection: CollectionWithCount) => void;
}

export function CollectionCard({ collection, onEdit, onDelete }: CollectionCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => void navigate(`/bookmarks?collection=${collection.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          void navigate(`/bookmarks?collection=${collection.id}`);
        }
      }}
      className="focus-visible:ring-ring cursor-pointer transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
    >
      <CardContent className="flex items-center gap-3">
        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
          <CollectionIcon type={collection.type} rule={collection.rule} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{collection.name}</p>
          <p className="text-xs text-[#555555]">
            {collection.bookmarkCount} bookmark{collection.bookmarkCount === 1 ? '' : 's'}
          </p>
        </div>
        {collection.type === 'custom' && (onEdit ?? onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={`More actions for ${collection.name}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => onEdit?.(collection)}>
                <Pencil /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete?.(collection)}
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
}
