import {
  LayoutDashboard,
  Bookmark,
  Copy,
  FolderKanban,
  BarChart3,
  Upload,
  Download,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/duplicates', label: 'Duplicates', icon: Copy },
  { to: '/collections', label: 'Collections', icon: FolderKanban },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/export', label: 'Export', icon: Download },
  { to: '/settings', label: 'Settings', icon: Settings },
];
