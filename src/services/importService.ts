import { normalizeUrl } from './urlNormalizer';
import type { ImportPreview, ImportValidationIssue, ParsedBookmarkNode } from '@/types';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'file:', 'ftp:']);

interface ParseResult {
  nodes: ParsedBookmarkNode[];
  issues: ImportValidationIssue[];
  totalFound: number;
  folderPaths: string[][];
}

function parseAddDate(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  // Netscape bookmark files store ADD_DATE as Unix seconds.
  return seconds * 1000;
}

function walkFolder(
  dl: Element,
  folderPath: string[],
  nodes: ParsedBookmarkNode[],
  issues: ImportValidationIssue[],
  folderPaths: string[][],
): void {
  const children = Array.from(dl.children);

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child?.tagName !== 'DT') continue;

    const first = child.firstElementChild;
    if (!first) continue;

    if (first.tagName === 'H3') {
      const folderName = first.textContent?.trim() || 'Untitled Folder';
      const thisFolderPath = [...folderPath, folderName];
      // Record every folder encountered, even ones with no direct bookmarks,
      // so empty folders survive import instead of vanishing silently.
      folderPaths.push(thisFolderPath);

      let nestedDl = child.querySelector(':scope > dl');

      if (!nestedDl) {
        const next = children[i + 1];
        if (next?.tagName === 'DL') {
          nestedDl = next;
          i++;
        }
      }

      if (nestedDl) {
        walkFolder(nestedDl, thisFolderPath, nodes, issues, folderPaths);
      }
      continue;
    }

    if (first.tagName === 'A') {
      const anchor = first as HTMLAnchorElement;
      const href = anchor.getAttribute('href');
      const rawTitle = anchor.textContent?.trim();

      if (!href) {
        issues.push({
          level: 'error',
          message: 'Bookmark is missing a URL and was skipped.',
          nodeTitle: rawTitle,
        });
        continue;
      }

      let protocol: string;
      try {
        protocol = new URL(href).protocol;
      } catch {
        issues.push({
          level: 'error',
          message: `Could not parse URL "${href}" and it was skipped.`,
          nodeTitle: rawTitle,
          url: href,
        });
        continue;
      }

      if (!ALLOWED_PROTOCOLS.has(protocol)) {
        issues.push({
          level: 'warning',
          message: `Unsupported URL scheme "${protocol}" was skipped.`,
          nodeTitle: rawTitle,
          url: href,
        });
        continue;
      }

      const title = rawTitle || href;
      if (!rawTitle) {
        issues.push({
          level: 'warning',
          message: 'Bookmark had no title; the URL was used instead.',
          url: href,
        });
      }

      nodes.push({
        title,
        url: href,
        originalUrl: href,
        addDate: parseAddDate(anchor.getAttribute('add_date')),
        faviconUrl: anchor.getAttribute('icon') ?? undefined,
        folderPath,
      });
    }
  }
}

/**
 * Parses a standard Netscape-format bookmarks HTML export (produced by every
 * major browser) into a flat list of bookmark nodes with folder breadcrumbs.
 */
export function parseBookmarksHtml(html: string): ParseResult {
  const issues: ImportValidationIssue[] = [];
  const nodes: ParsedBookmarkNode[] = [];
  const folderPaths: string[][] = [];

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const rootDl = doc.querySelector('dl');

  if (!rootDl) {
    issues.push({
      level: 'error',
      message:
        'No bookmark list was found in this file. Make sure it is a browser bookmarks HTML export.',
    });
    return { nodes, issues, totalFound: 0, folderPaths };
  }

  walkFolder(rootDl, [], nodes, issues, folderPaths);

  const errorCount = issues.filter((issue) => issue.level === 'error').length;
  return { nodes, issues, totalFound: nodes.length + errorCount, folderPaths };
}

/**
 * Parses the file and cross-references parsed URLs against what's already
 * stored, producing a full preview for the import review screen.
 */
export function buildImportPreview(
  fileName: string,
  html: string,
  existingNormalizedUrls: ReadonlySet<string>,
): ImportPreview {
  const { nodes, issues, totalFound, folderPaths } = parseBookmarksHtml(html);

  let duplicatesWithExisting = 0;
  for (const node of nodes) {
    const { normalized } = normalizeUrl(node.url);
    if (existingNormalizedUrls.has(normalized)) {
      duplicatesWithExisting++;
    }
  }

  return {
    fileName,
    totalFound,
    validBookmarks: nodes,
    issues,
    duplicatesWithExisting,
    folderPaths,
  };
}
