import { Outlet } from 'react-router-dom';
import { useGlobalShortcuts } from '@/hooks';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell() {
  useGlobalShortcuts();

  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[240px_1fr]">
      <a
        href="#main-content"
        className="bg-background text-foreground focus-visible:ring-ring sr-only z-50 rounded-md border px-4 py-2 text-sm focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:ring-2"
      >
        Skip to content
      </a>

      <aside className="hidden border-r md:block" aria-label="Sidebar">
        <div className="sticky top-0 h-svh">
          <Sidebar />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <Header />
        <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
