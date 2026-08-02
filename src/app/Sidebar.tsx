import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUiStore } from '@/store/uiStore';
import logoUrl from '@/assets/logo.svg';
import {
  isNavItemActive,
  MARKETING_SITE_URL,
  NAV_ITEMS,
  SETTINGS_NAV_ITEM,
  type NavItem,
} from './nav';

interface SidebarProps {
  onNavigate?: () => void;
  /** The mobile sheet renders a full-width sidebar with no collapse control. */
  allowCollapse?: boolean;
}

/** Label that fades and shrinks away instead of being removed outright — an instant
 *  unmount combined with the row's own justify-content/padding flipping in the same
 *  frame is what made the icon appear to "jump" when the sidebar collapsed. Animating
 *  padding/gap/max-width (all numeric, unlike justify-content) keeps the icon's motion
 *  smooth and in sync with the sidebar's own width transition. */
function CollapsibleLabel({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200',
        collapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100',
      )}
    >
      {children}
    </span>
  );
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
        'flex min-h-9 items-center rounded-lg py-2 text-sm font-medium transition-[padding,gap,color,background-color] duration-200',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        collapsed ? 'gap-0 px-4' : 'gap-3 px-3',
        active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground',
      )}
    >
      <item.icon className="size-4 shrink-0" aria-hidden="true" />
      <CollapsibleLabel collapsed={collapsed}>{item.label}</CollapsibleLabel>
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
        'flex min-h-9 w-full items-center rounded-lg py-2 text-sm font-medium text-muted-foreground transition-[padding,gap,color,background-color] duration-200',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        collapsed ? 'gap-0 px-4' : 'gap-3 px-3',
      )}
    >
      {collapsed ? (
        <PanelLeft className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" />
      )}
      <CollapsibleLabel collapsed={collapsed}>Collapse</CollapsibleLabel>
    </button>
  );

  return (
    <div className="bg-sidebar flex h-full flex-col">
      <a
        href={MARKETING_SITE_URL}
        target="_blank"
        rel="noreferrer"
        className={cn(
          'focus-visible:ring-ring flex items-center rounded-lg py-5 transition-[padding,gap] duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none',
          collapsed ? 'gap-0 px-6' : 'gap-2.5 px-5',
        )}
      >
        <img src={logoUrl} alt="" className="size-6 shrink-0" />
        <div
          className={cn(
            'min-w-0 overflow-hidden leading-tight transition-[max-width,opacity] duration-200',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100',
          )}
        >
          <p className="text-foreground text-sm font-bold whitespace-nowrap">Curo</p>
          <p className="truncate text-[11px] whitespace-nowrap text-muted-foreground">
            Curate. Organize. Rediscover.
          </p>
        </div>
      </a>

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
