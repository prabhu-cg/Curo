import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAnalyticsSnapshot, useBookmarks, useCollections } from '@/hooks';
import { BarDistributionChart } from './charts/BarDistributionChart';
import { GrowthChart } from './charts/GrowthChart';

export function AnalyticsPage() {
  const { bookmarks } = useBookmarks();
  const { collections } = useCollections(bookmarks);
  const snapshot = useAnalyticsSnapshot(bookmarks, collections);

  if (bookmarks.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Nothing to analyze yet"
        description="Import or add bookmarks to see domain, folder, and growth analytics."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Growth over time</CardTitle>
        </CardHeader>
        <CardContent>
          <GrowthChart data={snapshot.growth} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top domains</CardTitle>
        </CardHeader>
        <CardContent>
          <BarDistributionChart
            orientation="bars"
            data={snapshot.domains.map((d) => ({ label: d.domain, count: d.count }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top folders</CardTitle>
        </CardHeader>
        <CardContent>
          <BarDistributionChart
            orientation="bars"
            data={snapshot.folders.map((f) => ({ label: f.label, count: f.count }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bookmark age</CardTitle>
        </CardHeader>
        <CardContent>
          <BarDistributionChart orientation="columns" data={snapshot.ageBuckets} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.collections.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#555555]">
              No collections with bookmarks yet.
            </p>
          ) : (
            <BarDistributionChart
              orientation="bars"
              data={snapshot.collections.map((c) => ({ label: c.name, count: c.count }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
