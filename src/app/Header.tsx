import { useMemo, useState } from 'react';
import { Menu, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useUiStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import { NAV_ITEMS } from './nav';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const pageTitle = useMemo(() => {
    const match = NAV_ITEMS.filter((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    ).sort((a, b) => b.to.length - a.to.length)[0];
    return match?.label ?? 'Curo';
  }, [location.pathname]);

  return (
    <header className="bg-background/95 sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 backdrop-blur sm:px-6">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0 md:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Primary navigation links for Curo
          </SheetDescription>
          <Sidebar onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation menu"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      <h1 className="text-foreground shrink-0 text-base font-semibold">{pageTitle}</h1>

      <div className="ml-auto w-full max-w-sm">
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
        </InputGroup>
      </div>
    </header>
  );
}
