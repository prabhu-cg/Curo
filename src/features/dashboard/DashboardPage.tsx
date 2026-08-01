import {
  Bookmark,
  Copy,
  FolderKanban,
  Globe,
  LayoutDashboard,
  Plus,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useAnalyticsSnapshot,
  useBookmarks,
  useCollections,
  useDuplicates,
  useHealthScore,
} from '@/hooks';
import { GrowthChart } from '@/features/analytics/charts/GrowthChart';
import { StatTile } from './StatTile';
import { HealthScoreCard } from './HealthScoreCard';

export function DashboardPage() {
  const { bookmarks, isLoading } = useBookmarks();
  const { collections, customCollections } = useCollections(bookmarks);
  const snapshot = useAnalyticsSnapshot(bookmarks, collections);
  const health = useHealthScore(bookmarks);
  const duplicateGroups = useDuplicates(bookmarks);

  if (!isLoading && bookmarks.length === 0) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Welcome to Curo"
        description="Import your browser bookmarks or add one manually to see your dashboard come to life."
        action={
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/import">
                <Upload /> Import bookmarks
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/bookmarks">
                <Plus /> Add manually
              </Link>
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Bookmark} label="Bookmarks" value={snapshot.totalBookmarks} />
        <StatTile icon={Globe} label="Unique domains" value={snapshot.domains.length} />
        <StatTile
          icon={FolderKanban}
          label="Collections"
          value={customCollections.length}
        />
        <StatTile icon={Copy} label="Duplicate groups" value={duplicateGroups.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Growth over time</CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthChart data={snapshot.growth} height={220} />
          </CardContent>
        </Card>

        <HealthScoreCard health={health} />
      </div>
    </div>
  );
}
