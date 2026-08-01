import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6 text-[#555555]" aria-hidden="true" />
      </div>
      <h2 className="text-foreground text-sm font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[#555555]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
