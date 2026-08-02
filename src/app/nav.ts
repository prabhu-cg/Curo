import {
  LayoutDashboard,
  HeartPulse,
  Bookmark,
  Copy,
  Sparkles,
  FolderKanban,
  BarChart3,
  ArrowLeftRight,
  Settings,
  type LucideIcon,
} from 'lucide-react';

/** The marketing site the sidebar logo links back to. Update once deployed. */
export const MARKETING_SITE_URL = 'https://getcuro.vercel.app';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Extra path prefixes that should also count as "active" for this item. */
  matchPrefixes?: string[];
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const prefixes = [item.to, ...(item.matchPrefixes ?? [])];
  return prefixes.some((prefix) =>
    item.end ? pathname === prefix : pathname.startsWith(prefix),
  );
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/health', label: 'Health', icon: HeartPulse },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/duplicates', label: 'Duplicates', icon: Copy },
  { to: '/cleanup', label: 'Cleanup', icon: Sparkles },
  { to: '/collections', label: 'Collections', icon: FolderKanban },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  {
    to: '/import',
    label: 'Import / Export',
    icon: ArrowLeftRight,
    matchPrefixes: ['/export'],
  },
];

/** Rendered separately, pinned to the bottom of the sidebar. */
export const SETTINGS_NAV_ITEM: NavItem = {
  to: '/settings',
  label: 'Settings',
  icon: Settings,
};

/** All items, including Settings — used for page-title lookup by route. */
export const ALL_NAV_ITEMS: NavItem[] = [...NAV_ITEMS, SETTINGS_NAV_ITEM];

export function getPageTitle(pathname: string): string {
  const match = ALL_NAV_ITEMS.filter((item) => isNavItemActive(item, pathname)).sort(
    (a, b) => b.to.length - a.to.length,
  )[0];
  return match?.label ?? 'Curo';
}
