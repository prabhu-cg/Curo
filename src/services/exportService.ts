import Papa from 'papaparse';
import JSZip from 'jszip';
import type { Bookmark, ExportFormat } from '@/types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface FolderNode {
  name: string;
  children: Map<string, FolderNode>;
  bookmarks: Bookmark[];
}

function createFolderNode(name: string): FolderNode {
  return { name, children: new Map(), bookmarks: [] };
}

function buildFolderTree(bookmarks: Bookmark[]): FolderNode {
  const root = createFolderNode('');

  for (const bookmark of bookmarks) {
    let node = root;
    for (const segment of bookmark.folderPath) {
      let child = node.children.get(segment);
      if (!child) {
        child = createFolderNode(segment);
        node.children.set(segment, child);
      }
      node = child;
    }
    node.bookmarks.push(bookmark);
  }

  return root;
}

function renderHtmlNode(node: FolderNode, depth: number): string {
  const indent = '    '.repeat(depth);
  const lines: string[] = [`${indent}<DL><p>`];

  for (const bookmark of node.bookmarks) {
    const addDate = Math.round(bookmark.dateAdded / 1000);
    lines.push(
      `${indent}    <DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${addDate}"${
        bookmark.faviconUrl ? ` ICON="${escapeHtml(bookmark.faviconUrl)}"` : ''
      }>${escapeHtml(bookmark.title)}</A>`,
    );
  }

  for (const child of node.children.values()) {
    lines.push(`${indent}    <DT><H3>${escapeHtml(child.name)}</H3>`);
    lines.push(renderHtmlNode(child, depth + 1));
  }

  lines.push(`${indent}</DL><p>`);
  return lines.join('\n');
}

/** Produces a standard Netscape-format bookmarks.html file, importable by every major browser. */
export function toNetscapeHtml(
  bookmarks: Bookmark[],
  options: { includeFolderStructure: boolean } = { includeFolderStructure: true },
): string {
  const effective = options.includeFolderStructure
    ? bookmarks
    : bookmarks.map((b) => ({ ...b, folderPath: [] }));

  const tree = buildFolderTree(effective);
  const body = renderHtmlNode(tree, 0);

  return [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    body,
  ].join('\n');
}

export function toCsv(
  bookmarks: Bookmark[],
  collectionNameById: ReadonlyMap<string, string> = new Map(),
): string {
  const rows = bookmarks.map((b) => ({
    title: b.title,
    url: b.url,
    domain: b.domain,
    folder: b.folderPath.join(' / '),
    tags: b.tags.join(', '),
    collections: b.collectionIds
      .map((id) => collectionNameById.get(id))
      .filter(Boolean)
      .join(', '),
    dateAdded: new Date(b.dateAdded).toISOString(),
    favorite: b.isFavorite,
    notes: b.notes ?? '',
  }));

  return Papa.unparse(rows);
}

export function toJson(bookmarks: Bookmark[]): string {
  return JSON.stringify(bookmarks, null, 2);
}

export function toMarkdown(bookmarks: Bookmark[]): string {
  const tree = buildFolderTree(bookmarks);
  const lines: string[] = ['# Bookmarks', ''];

  function renderMarkdownNode(node: FolderNode, depth: number): void {
    if (node.name) {
      lines.push(`${'#'.repeat(Math.min(depth + 1, 6))} ${node.name}`, '');
    }
    for (const bookmark of node.bookmarks) {
      const tags = bookmark.tags.length > 0 ? ` \`${bookmark.tags.join('` `')}\`` : '';
      lines.push(`- [${bookmark.title}](${bookmark.url})${tags}`);
    }
    if (node.bookmarks.length > 0) lines.push('');
    for (const child of node.children.values()) {
      renderMarkdownNode(child, depth + 1);
    }
  }

  renderMarkdownNode(tree, 0);
  return lines.join('\n');
}

const EXTENSIONS: Record<ExportFormat, string> = {
  html: 'html',
  csv: 'csv',
  json: 'json',
  markdown: 'md',
};

export function generateExport(
  format: ExportFormat,
  bookmarks: Bookmark[],
  options: {
    includeFolderStructure?: boolean;
    collectionNameById?: ReadonlyMap<string, string>;
  } = {},
): { content: string; fileName: string; mimeType: string } {
  const includeFolderStructure = options.includeFolderStructure ?? true;

  switch (format) {
    case 'html':
      return {
        content: toNetscapeHtml(bookmarks, { includeFolderStructure }),
        fileName: `curo-bookmarks.${EXTENSIONS.html}`,
        mimeType: 'text/html',
      };
    case 'csv':
      return {
        content: toCsv(bookmarks, options.collectionNameById),
        fileName: `curo-bookmarks.${EXTENSIONS.csv}`,
        mimeType: 'text/csv',
      };
    case 'json':
      return {
        content: toJson(bookmarks),
        fileName: `curo-bookmarks.${EXTENSIONS.json}`,
        mimeType: 'application/json',
      };
    case 'markdown':
      return {
        content: toMarkdown(bookmarks),
        fileName: `curo-bookmarks.${EXTENSIONS.markdown}`,
        mimeType: 'text/markdown',
      };
  }
}

export async function generateExportZip(
  formats: ExportFormat[],
  bookmarks: Bookmark[],
  options: {
    includeFolderStructure?: boolean;
    collectionNameById?: ReadonlyMap<string, string>;
  } = {},
): Promise<Blob> {
  const zip = new JSZip();
  for (const format of formats) {
    const { content, fileName } = generateExport(format, bookmarks, options);
    zip.file(fileName, content);
  }
  return zip.generateAsync({ type: 'blob' });
}

export function downloadTextFile(
  content: string,
  fileName: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, fileName);
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
