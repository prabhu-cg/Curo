import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
}

export function StatTile({ icon: Icon, label, value }: StatTileProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
