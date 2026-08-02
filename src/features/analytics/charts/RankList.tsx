import type { LucideIcon } from 'lucide-react';
import { CHART_COLOR } from '@/lib/chartTheme';

export interface RankListItem {
  /** Present when this row should be clickable — omit to render as plain (non-interactive) text. */
  id?: string;
  /** Truncated display text. */
  label: string;
  /** Full text shown via the row's title attribute — defaults to `label`. */
  fullLabel?: string;
  count: number;
}

interface RankListProps {
  data: RankListItem[];
  icon?: LucideIcon;
  onSelect?: (id: string) => void;
  emptyMessage?: string;
}

/** Compact ranked list — icon, truncated label, proportional bar, count. A more legible
 *  alternative to a Recharts horizontal bar chart when labels can be arbitrarily long:
 *  Recharts' category axis doesn't truncate or wrap, so long labels overlap or vanish. */
export function RankList({
  data,
  icon: Icon,
  onSelect,
  emptyMessage = 'Nothing to show yet.',
}: RankListProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const max = Math.max(...data.map((d) => d.count));

  return (
    <ul className="space-y-1">
      {data.map((item) => {
        const title = item.fullLabel ?? item.label;
        const content = (
          <>
            {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
            <span className="w-40 shrink-0 truncate text-sm">{item.label}</span>
            <div className="bg-muted h-2 min-w-0 flex-1 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(4, (item.count / max) * 100)}%`,
                  backgroundColor: CHART_COLOR,
                }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
              {item.count}
            </span>
          </>
        );

        if (!onSelect || !item.id) {
          return (
            <li
              key={item.label}
              className="flex items-center gap-3 rounded-md px-1 py-1.5"
              title={title}
            >
              {content}
            </li>
          );
        }

        const id = item.id;
        return (
          <li key={item.label}>
            <button
              type="button"
              title={title}
              onClick={() => onSelect(id)}
              className="hover:bg-muted focus-visible:ring-ring flex w-full items-center gap-3 rounded-md px-1 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {content}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
