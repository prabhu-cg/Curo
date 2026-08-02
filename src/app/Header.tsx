import { useState } from 'react';
import { CircleCheck, Menu, Monitor, Moon, Search, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MOD_KEY_LABEL } from '@/lib/platform';
import { useUiStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';

type ThemeChoice = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function handleThemeSelect(choice: ThemeChoice) {
    if (choice !== 'light') {
      toast.info('Dark mode is coming in a future release.');
    }
  }

  return (
    <header className="bg-background/95 sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 backdrop-blur sm:px-6">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0 md:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Primary navigation links for Curo
          </SheetDescription>
          <Sidebar onNavigate={() => setMobileNavOpen(false)} allowCollapse={false} />
        </SheetContent>
      </Sheet>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 md:hidden"
        aria-label="Open navigation menu"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      <div className="w-full max-w-sm">
        <InputGroup>
          <InputGroupAddon>
            <Search className="size-4" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id="global-search"
            type="search"
            placeholder="Search bookmarks…"
            aria-label="Search bookmarks"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && location.pathname !== '/bookmarks') {
                void navigate('/bookmarks');
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <kbd className="border-border bg-sidebar text-muted-foreground pointer-events-none hidden items-center rounded border px-1.5 py-0.5 font-mono text-[11px] sm:inline-flex">
              {MOD_KEY_LABEL}K
            </kbd>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <CircleCheck className="size-3.5 text-[#2a6f6f]" aria-hidden="true" />
          All changes saved locally
        </span>

        <div
          role="radiogroup"
          aria-label="Theme"
          className="border-border bg-sidebar flex items-center gap-0.5 rounded-lg border p-0.5"
        >
          {THEME_OPTIONS.map((option) => {
            const isActive = option.value === 'light';
            return (
              <Tooltip key={option.value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-label={`${option.label} theme`}
                    onClick={() => handleThemeSelect(option.value)}
                    className={cn(
                      'focus-visible:ring-ring flex size-7 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none',
                      isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <option.icon className="size-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {option.label}
                  {option.value !== 'light' && ' (coming soon)'}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </header>
  );
}
