import { BarChart3, FolderKanban, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAnalyticsSnapshot, useBookmarks, useCollections } from '@/hooks';
import { BarDistributionChart } from './charts/BarDistributionChart';
import { FolderRankList } from './charts/FolderRankList';
import { GrowthChart } from './charts/GrowthChart';
import { RankList } from './charts/RankList';

export function AnalyticsPage() {
  const { bookmarks } = useBookmarks();
  const { collections } = useCollections(bookmarks);
  const snapshot = useAnalyticsSnapshot(bookmarks, collections);
  const navigate = useNavigate();

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
          <CardTitle className="text-sm font-semibold">Growth over time</CardTitle>
          <CardDescription>
            Total bookmarks saved, cumulative month by month, since your first save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GrowthChart data={snapshot.growth} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Top domains</CardTitle>
          <CardDescription>
            The sites you bookmark from most often. Click a row to see those bookmarks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RankList
            icon={Globe}
            data={snapshot.domains.map((d) => ({
              label: d.domain,
              count: d.count,
              // "Other" is an aggregate of everything past the top domains — not a
              // real filterable value, so it's left non-clickable.
              id: d.domain === 'Other' ? undefined : d.domain,
            }))}
            onSelect={(domain) => void navigate(`/bookmarks?domain=${encodeURIComponent(domain)}`)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Top folders</CardTitle>
          <CardDescription>
            Folders holding the most bookmarks. Click a row to see those bookmarks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FolderRankList
            data={snapshot.folders}
            onSelect={(folderValue) =>
              void navigate(`/bookmarks?folder=${encodeURIComponent(folderValue)}`)
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Bookmark age</CardTitle>
          <CardDescription>How long ago your bookmarks were originally saved.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarDistributionChart data={snapshot.ageBuckets} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Collections</CardTitle>
          <CardDescription>
            How your bookmarks are spread across collections. Click a row to open one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RankList
            icon={FolderKanban}
            emptyMessage="No collections with bookmarks yet."
            data={snapshot.collections.map((c) => ({
              label: c.name,
              count: c.count,
              id: c.collectionId,
            }))}
            onSelect={(collectionId) =>
              void navigate(`/bookmarks?collection=${encodeURIComponent(collectionId)}`)
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
