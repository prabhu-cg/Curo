# Curo

**Curate. Organize. Rediscover.**

Curo is a local-first personal knowledge curator for browser bookmarks. Import a
bookmarks export from any browser, clean it up, organize it, search it, and export
it back out — all client-side, in your browser's own storage. No account, no
server, no AI, no analytics.

## Features

1. **Dashboard** — KPIs, a growth-over-time chart, and a Knowledge Health Score
   with a weighted breakdown (duplicate-free, organized, tagged, well-labeled,
   fresh).
2. **Import** — drag-and-drop or browse a standard Netscape-format bookmarks HTML
   export (Chrome, Firefox, Safari, Edge all produce this). Live preview with
   per-entry validation before anything is written to storage.
3. **Local persistence** — everything lives in IndexedDB via Dexie.js. Nothing
   leaves the browser.
4. **URL normalization** — tracking parameters (`utm_*`, `fbclid`, `gclid`, …)
   are stripped, hosts are lowercased, default ports and trailing slashes are
   removed, and a bare `www.` is treated as the same site — all so that
   equivalent URLs collapse to one canonical form for storage and dedupe.
5. **Duplicate detection** — exact-URL groups plus a fuzzy near-duplicate pass
   (same domain, near-identical title) via Fuse.js. Review each group, pick a
   canonical entry (tags and collections are merged in), or auto-resolve
   everything in one click.
6. **Collections** — custom, user-created collections plus automatic ones
   (Favorites, Recently Added, Uncategorized, top domains, top folders) computed
   live from your bookmarks.
7. **Bookmark table** — virtualized (TanStack Virtual) and sortable/filterable
   (TanStack Table) for large libraries, with bulk actions (favorite, tag, add to
   collection, delete) and per-row actions.
8. **Fuzzy search** — Fuse.js across title, URL, domain, folder, collection, and
   tags, wired into the global header search bar (press `/` to focus it).
9. **Analytics** — domain, folder, collection, and bookmark-age distributions
   plus growth over time, rendered with Recharts.
10. **Export** — HTML, CSV, JSON, or Markdown, scoped to all bookmarks,
    favorites, or a single collection. Multiple formats bundle into a zip
    (JSZip).
11. **Settings** — appearance density, import/export defaults, full-library
    backup/restore (JSON), a keyboard-shortcut reference, and (development
    builds only) sample-data seeding.
12. **Empty states and error handling everywhere** — every data-dependent view
    has a real empty state, and a global error boundary plus an
    unhandled-rejection listener keep failures visible instead of silent.

Explicitly **not** in this version: AI/ML features, cloud sync, user accounts,
analytics/telemetry, or any paid service. See [Future extension points](#future-extension-points)
for how the codebase leaves room for these later.

## Getting started

```bash
npm install
npm run dev       # start the dev server
```

Then open the printed local URL. There's nothing to configure — no environment
variables, no backend, no API keys.

### Other scripts

| Script                                    | What it does                                            |
| ----------------------------------------- | ------------------------------------------------------- |
| `npm run build`                           | Type-checks and builds the production bundle to `dist/` |
| `npm run preview`                         | Serves the production build locally                     |
| `npm run lint` / `npm run lint:fix`       | ESLint (flat config, type-aware)                        |
| `npm run format` / `npm run format:check` | Prettier                                                |
| `npm run typecheck`                       | `tsc -b --noEmit` across the whole project              |
| `npm run test` / `npm run test:watch`     | Vitest unit tests                                       |
| `npm run test:coverage`                   | Vitest with coverage                                    |
| `npm run test:e2e`                        | Playwright end-to-end tests (starts its own dev server) |
| `npm run test:e2e:ui`                     | Playwright's interactive UI mode                        |

### Trying it with real data

Export your bookmarks from your browser (Chrome: `chrome://bookmarks` → ⋮ menu
→ "Export bookmarks"; similar in Firefox, Safari, and Edge) and drop the
resulting `.html` file onto the Import page. Or, in a dev build, go to
**Settings → Development → Load sample data** to seed a small realistic dataset.

## Architecture

Curo is a strict-TypeScript, feature-based React app with a hard separation
between **UI**, **hooks**, and **services**:

```
UI components (features/**, app/**)
        │  calls
        ▼
Hooks (hooks/**)            ← reactive data via Dexie live queries, or
                               useMemo-computed derived data
        │  calls
        ▼
Services (services/**)      ← all business logic and persistence, pure
                               functions + Dexie reads/writes, zero React
        │
        ▼
IndexedDB (via Dexie.js)
```

- **No business logic in components.** A component orchestrates: it reads data
  via a hook, renders it, and calls a service function in response to user
  action. URL normalization, dedupe matching, health-score math, CSV/HTML
  generation — all of that lives in `src/services/*.ts` as plain, independently
  unit-tested functions with no React dependency.
- **Dexie is the single source of truth for persisted data.** Bookmarks,
  collections, and settings are never duplicated into a client-side store.
  Components read them reactively through `dexie-react-hooks`' `useLiveQuery`
  (wrapped in `src/hooks/useBookmarks.ts`, `useCollections.ts`, `useSettings.ts`),
  so any write from anywhere in the app is reflected everywhere instantly.
- **Zustand is reserved for ephemeral UI state** that intentionally isn't
  persisted data — currently just the global search query and the sidebar's
  collapsed preference (`src/store/uiStore.ts`). This avoids ever having two
  sources of truth for the same bookmark data.
- **Computed data is memoized, not stored.** Duplicate groups, analytics
  snapshots, the health score, and search results are pure functions of the
  current bookmark set, computed on demand via `useMemo`-based hooks
  (`useDuplicates`, `useAnalyticsSnapshot`, `useHealthScore`,
  `useBookmarkSearch`) rather than kept in sync by hand.

### Folder structure

```
src/
  app/                 Shell: routing, Sidebar, Header, ErrorBoundary
  components/
    ui/                shadcn/ui primitives (generated, lightly patched — see note below)
    shared/             Small reusable pieces used across features (EmptyState, ChartTooltip)
  data/                Sample dataset for development (gated by import.meta.env.DEV)
  features/            One folder per feature area, each owning its page(s) and
                        feature-local components:
    dashboard/  bookmarks/  duplicates/  collections/
    analytics/  import/     export/      settings/
  hooks/               Reactive data hooks (Dexie live queries) and computed-data hooks
  lib/                 Small framework-agnostic helpers (cn(), chart theme constants)
  services/            All persistence and business logic — see below
  store/               Zustand stores (UI-only state)
  test/                Vitest setup
  types/               Shared domain types (Bookmark, Collection, Settings, …)
e2e/                   Playwright end-to-end tests + fixtures
```

### Services

| Service                 | Responsibility                                                    |
| ----------------------- | ----------------------------------------------------------------- |
| `db.ts`                 | Dexie database + schema (bookmarks, collections, settings tables) |
| `urlNormalizer.ts`      | Tracking-parameter stripping, host/port/slash normalization       |
| `importService.ts`      | Netscape bookmarks HTML parsing + validation                      |
| `bookmarkService.ts`    | Bookmark CRUD, bulk operations, import persistence                |
| `dedupeService.ts`      | Exact-URL and fuzzy near-duplicate detection, merging             |
| `collectionService.ts`  | Custom collection CRUD + automatic collection rules               |
| `searchService.ts`      | Fuse.js index construction and querying                           |
| `analyticsService.ts`   | Domain/folder/collection/age/growth aggregation                   |
| `healthScoreService.ts` | Knowledge Health Score computation                                |
| `exportService.ts`      | HTML/CSV/JSON/Markdown generation + zip bundling                  |
| `settingsService.ts`    | Settings persistence, full-library backup/restore                 |
| `demoDataService.ts`    | Seeds/clears the development sample dataset                       |

Every service above has unit tests colocated as `*.test.ts`.

### A note on `components/ui`

These are shadcn/ui components generated via the CLI against the "radix-nova"
style. While building the Settings page we found that several of the generated
components used Tailwind's bare `data-word:` variant (which matches literal
attribute _presence_) where the underlying Radix primitive actually exposes
that state through a _named_ attribute value — `data-state="checked"`, not a
standalone `data-checked` attribute. We patched every affected component
(`switch`, `checkbox`, `radio-group`, `dialog`, `alert-dialog`, `popover`,
`dropdown-menu`, `select`, `sheet`, `tabs`, `tooltip`, `separator`,
`scroll-area`) to use the correct `data-[state=checked]:` /
`data-[orientation=horizontal]:` form. If you regenerate any of these via the
shadcn CLI, re-check for this pattern.

## Design system

- **Font:** Manrope (variable), self-hosted via `@fontsource-variable/manrope`.
- **Colors:** accent `#C74504`, primary text `#555555`, otherwise a neutral
  gray scale — defined as CSS custom properties in `src/index.css` and consumed
  through Tailwind v4's `@theme inline` mapping.
- **Light mode only in V1.** The `@custom-variant dark` plumbing is in place
  (see Future extension points) but no dark palette or toggle ships yet.
- Chart colors follow a single-hue-per-chart approach (see `src/lib/chartTheme.ts`)
  since every chart in the app is single-series — categories are already named
  on the axis, so a categorical multi-hue palette would be redundant, not
  clarifying.

## Testing

- **Unit (Vitest + Testing Library + fake-indexeddb):** every service function,
  colocated as `src/services/*.test.ts`. Run with `npm run test`.
- **End-to-end (Playwright):** `e2e/*.spec.ts` covers the four flows called out
  in the brief — import (with a validation-error case), fuzzy search, duplicate
  detection + merge, and export (single format, multi-format zip, and a scoped
  export). Run with `npm run test:e2e`.

## Future extension points

The architecture was deliberately kept boring and layered so the following can
be added without restructuring what's already here:

- **Browser extension.** The services layer has zero DOM/React dependencies —
  it could be imported directly into a WebExtension background script to sync
  live bookmark events (`chrome.bookmarks.onCreated`, etc.) into the same Dexie
  database, or into a shared format the extension and web app both read.
- **Cloud sync.** `bookmarkService`, `collectionService`, and `settingsService`
  are the only things that touch Dexie. Introducing a sync layer means adding a
  new service that watches Dexie's `db.on('changes')` stream and reconciles
  with a remote store — no UI component would need to change, since components
  never talk to Dexie directly.
- **AI categorization / semantic search.** `searchService.ts` already isolates
  "how a query becomes ranked results" behind `buildSearchIndex`/`searchBookmarks`.
  A semantic-search backend (embeddings + vector search) is a drop-in
  replacement for those two functions; `useBookmarkSearch` wouldn't need to
  change its signature. Similarly, an AI auto-tagging feature would be a new
  service that calls `bookmarkService.updateBookmark`, same as every other
  mutation in the app.
- **Collaboration.** The `Bookmark`/`Collection` types and Dexie schema don't
  encode a single-user assumption anywhere structural (no hardcoded "owner" ID
  baked into query logic) — multi-user support would mean adding an owner/share
  field to the schema and gating queries by it, not redesigning it.
- **Dark mode.** `index.css` already defines the class-based `@custom-variant
dark` Tailwind hook and a (currently unused, identical-to-light) `.dark`
  block — a real dark palette plus a theme toggle in Settings would slot in
  without touching component markup, since components consume semantic tokens
  (`bg-background`, `text-foreground`, …) rather than hardcoded colors.

## Known limitations (V1)

- No dark mode (by design for this version — see above).
- Bookmarks belong to a single folder path (as imported) plus any number of
  custom collections; there's no drag-and-drop folder reorganization UI.
- The near-duplicate pass compares title similarity within the same domain; it
  won't catch duplicates that were retitled entirely differently.
