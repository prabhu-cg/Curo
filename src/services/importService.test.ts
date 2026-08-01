import { describe, expect, it } from 'vitest';
import { buildImportPreview, parseBookmarksHtml } from './importService';

const SAMPLE_HTML = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><A HREF="https://example.com/" ADD_DATE="1700000000">Example</A>
    <DT><H3 ADD_DATE="1600000000">Dev</H3>
    <DL><p>
        <DT><A HREF="https://react.dev/" ADD_DATE="1650000000">React</A>
        <DT><H3>Nested</H3>
        <DL><p>
            <DT><A HREF="https://nested.example.com/">Nested Link</A>
        </DL><p>
    </DL><p>
    <DT><A HREF="not-a-real-url">Broken</A>
    <DT><A>No href at all</A>
</DL><p>
`;

describe('parseBookmarksHtml', () => {
  it('extracts top-level bookmarks with no folder path', () => {
    const { nodes } = parseBookmarksHtml(SAMPLE_HTML);
    const example = nodes.find((n) => n.url === 'https://example.com/');
    expect(example).toBeDefined();
    expect(example?.folderPath).toEqual([]);
    expect(example?.title).toBe('Example');
    expect(example?.addDate).toBe(1_700_000_000_000);
  });

  it('tracks folder breadcrumbs for nested bookmarks', () => {
    const { nodes } = parseBookmarksHtml(SAMPLE_HTML);
    const react = nodes.find((n) => n.url === 'https://react.dev/');
    expect(react?.folderPath).toEqual(['Dev']);

    const nested = nodes.find((n) => n.url === 'https://nested.example.com/');
    expect(nested?.folderPath).toEqual(['Dev', 'Nested']);
  });

  it('reports an error and skips entries with an unparseable URL', () => {
    const { nodes, issues } = parseBookmarksHtml(SAMPLE_HTML);
    expect(nodes.find((n) => n.title === 'Broken')).toBeUndefined();
    expect(
      issues.some((i) => i.level === 'error' && i.message.includes('not-a-real-url')),
    ).toBe(true);
  });

  it('reports an error and skips entries with no href', () => {
    const { issues } = parseBookmarksHtml(SAMPLE_HTML);
    expect(
      issues.some((i) => i.level === 'error' && i.message.includes('missing a URL')),
    ).toBe(true);
  });

  it('errors when the file has no bookmark list at all', () => {
    const { nodes, issues } = parseBookmarksHtml(
      '<html><body>nothing here</body></html>',
    );
    expect(nodes).toHaveLength(0);
    expect(issues[0]?.level).toBe('error');
  });
});

describe('buildImportPreview', () => {
  it('counts how many parsed bookmarks already exist', () => {
    const existing = new Set(['https://example.com/']);
    const preview = buildImportPreview('bookmarks.html', SAMPLE_HTML, existing);
    expect(preview.duplicatesWithExisting).toBe(1);
    expect(preview.fileName).toBe('bookmarks.html');
  });
});
