import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import logoUrl from '@/assets/logo.svg';
import { NAV_ITEMS } from './nav';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <div className="bg-sidebar flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src={logoUrl} alt="" className="size-6" />
        <div className="leading-tight">
          <p className="text-foreground text-sm font-bold">Curo</p>
          <p className="text-[11px] text-[#555555]">Curate. Organize. Rediscover.</p>
        </div>
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-[#555555]',
              )
            }
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-[11px] text-[#555555]">
        Local-first · No account needed
      </div>
    </div>
  );
}
