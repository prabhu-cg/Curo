import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportPage } from '@/features/import/ImportPage';
import { ExportPage } from '@/features/export/ExportPage';

type ImportExportTab = 'import' | 'export';

function tabFromPath(pathname: string): ImportExportTab {
  return pathname.startsWith('/export') ? 'export' : 'import';
}

/**
 * Combines Import and Export under one sidebar entry with tabs, while
 * keeping /import and /export as separate, directly-linkable routes. The
 * active tab is derived from the URL, and switching tabs navigates — so the
 * URL is always the single source of truth.
 */
export function ImportExportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = tabFromPath(location.pathname);

  function handleTabChange(value: string) {
    void navigate(value === 'export' ? '/export' : '/import');
  }

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="import">Import</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>
      <TabsContent value="import" className="mt-4">
        <ImportPage />
      </TabsContent>
      <TabsContent value="export" className="mt-4">
        <ExportPage />
      </TabsContent>
    </Tabs>
  );
}
