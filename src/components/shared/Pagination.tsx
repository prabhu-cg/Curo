import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  /** Extra classes for the root — e.g. `border-t pt-3` when not already inside a
   *  bordered footer (like CardFooter). */
  className?: string;
}

/** Simple prev/next pager. Renders nothing when everything fits on one page. */
export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel = 'items',
  className,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  if (pageCount <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className={cn('flex w-full items-center justify-between gap-3', className)}>
      <p className="text-xs text-muted-foreground">
        Showing {start}–{end} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft /> Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {currentPage} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
