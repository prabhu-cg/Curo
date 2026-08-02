import { NavLink, useLocation } from 'react-router-dom';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUiStore } from '@/store/uiStore';
import logoUrl from '@/assets/logo.svg';
import { isNavItemActive, NAV_ITEMS, SETTINGS_NAV_ITEM, type NavItem } from './nav';

interface SidebarProps {
  onNavigate?: () => void;
  /** The mobile sheet renders a full-width sidebar with no collapse control. */
  allowCollapse?: boolean;
}

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const active = isNavItemActive(item, location.pathname);

  const link = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        collapsed && 'justify-center px-0',
        active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-[#555555]',
      )}
    >
      <item.icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed && item.label}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({ onNavigate, allowCollapse = true }: SidebarProps) {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const collapsed = allowCollapse && sidebarCollapsed;

  const collapseButton = (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#555555] transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        collapsed && 'justify-center px-0',
      )}
    >
      {collapsed ? (
        <PanelLeft className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" />
      )}
      {!collapsed && 'Collapse'}
    </button>
  );

  return (
    <div className="bg-sidebar flex h-full flex-col">
      <div
        className={cn(
          'flex items-center gap-2.5 px-5 py-5',
          collapsed && 'justify-center px-0',
        )}
      >
        <img src={logoUrl} alt="" className="size-6 shrink-0" />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="text-foreground text-sm font-bold">Curo</p>
            <p className="truncate text-[11px] text-[#555555]">
              Curate. Organize. Rediscover.
            </p>
          </div>
        )}
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-sidebar-border space-y-0.5 border-t px-3 py-3">
        <SidebarLink item={SETTINGS_NAV_ITEM} collapsed={collapsed} onNavigate={onNavigate} />
        {allowCollapse &&
          (collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>{collapseButton}</TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            collapseButton
          ))}
      </div>
    </div>
  );
}
