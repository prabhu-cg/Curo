import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/**
 * Ephemeral / preference-only UI state. Bookmark, collection, and settings
 * data live in IndexedDB and are read reactively via Dexie live queries
 * (see src/hooks) rather than mirrored here, so there is exactly one source
 * of truth for persisted data.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      searchQuery: '',
      setSearchQuery: (searchQuery) => {
        set({ searchQuery });
      },
    }),
    {
      name: 'curo-ui',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
