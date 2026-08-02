import type { CSSProperties } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useGlobalShortcuts } from '@/hooks';
import { useUiStore } from '@/store/uiStore';
import { getPageTitle } from './nav';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell() {
  useGlobalShortcuts();
  const location = useLocation();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const pageTitle = getPageTitle(location.pathname);

  return (
    <div
      className="grid h-svh grid-cols-1 transition-[grid-template-columns] duration-200 md:[grid-template-columns:var(--sidebar-w)_1fr]"
      style={{ '--sidebar-w': sidebarCollapsed ? '72px' : '240px' } as CSSProperties}
    >
      <a
        href="#main-content"
        className="bg-background text-foreground focus-visible:ring-ring sr-only z-50 rounded-md border px-4 py-2 text-sm focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:ring-2"
      >
        Skip to content
      </a>

      <aside className="hidden border-r md:block" aria-label="Sidebar">
        <div className="h-full">
          <Sidebar />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col">
        <Header />
        <main
          id="main-content"
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8"
        >
          <h1 className="text-foreground mb-6 shrink-0 text-2xl font-semibold tracking-tight">
            {pageTitle}
          </h1>
          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
