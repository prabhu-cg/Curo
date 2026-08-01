import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { getSettings } from '@/services/settingsService';
import { AppShell } from '@/app/AppShell';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { BookmarksPage } from '@/features/bookmarks/BookmarksPage';
import { DuplicatesPage } from '@/features/duplicates/DuplicatesPage';
import { CollectionsPage } from '@/features/collections/CollectionsPage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { ImportPage } from '@/features/import/ImportPage';
import { ExportPage } from '@/features/export/ExportPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

function App() {
  useEffect(() => {
    void getSettings();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="bookmarks" element={<BookmarksPage />} />
            <Route path="duplicates" element={<DuplicatesPage />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
