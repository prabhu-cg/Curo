import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getSettings } from '@/services/settingsService';
import { AppShell } from '@/app/AppShell';
import { ErrorBoundary } from '@/app/ErrorBoundary';

const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  })),
);
const HealthCenterPage = lazy(() =>
  import('@/features/health/HealthCenterPage').then((m) => ({
    default: m.HealthCenterPage,
  })),
);
const CleanupPage = lazy(() =>
  import('@/features/cleanup/CleanupPage').then((m) => ({ default: m.CleanupPage })),
);
const BookmarksPage = lazy(() =>
  import('@/features/bookmarks/BookmarksPage').then((m) => ({
    default: m.BookmarksPage,
  })),
);
const DuplicatesPage = lazy(() =>
  import('@/features/duplicates/DuplicatesPage').then((m) => ({
    default: m.DuplicatesPage,
  })),
);
const CollectionsPage = lazy(() =>
  import('@/features/collections/CollectionsPage').then((m) => ({
    default: m.CollectionsPage,
  })),
);
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/AnalyticsPage').then((m) => ({
    default: m.AnalyticsPage,
  })),
);
const ImportExportPage = lazy(() =>
  import('@/features/importExport/ImportExportPage').then((m) => ({
    default: m.ImportExportPage,
  })),
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

function RouteFallback() {
  return (
    <div className="flex justify-center py-24">
      <Loader2
        className="text-muted-foreground size-6 animate-spin"
        aria-label="Loading"
      />
    </div>
  );
}

function App() {
  useEffect(() => {
    void getSettings();

    function handleRejection(event: PromiseRejectionEvent) {
      console.error('Unhandled error:', event.reason);
      toast.error('Something went wrong saving your changes. Please try again.');
    }

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={300}>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="health" element={<HealthCenterPage />} />
                <Route path="bookmarks" element={<BookmarksPage />} />
                <Route path="duplicates" element={<DuplicatesPage />} />
                <Route path="cleanup" element={<CleanupPage />} />
                <Route path="collections" element={<CollectionsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="import" element={<ImportExportPage />} />
                <Route path="export" element={<ImportExportPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
