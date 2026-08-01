import { describe, expect, it } from 'vitest';
import { normalizeUrl, extractDomain } from './urlNormalizer';

describe('normalizeUrl', () => {
  it('strips tracking parameters', () => {
    const result = normalizeUrl(
      'https://example.com/page?utm_source=newsletter&utm_medium=email&id=42',
    );
    expect(result.normalized).toBe('https://example.com/page?id=42');
  });

  it('sorts remaining query parameters deterministically', () => {
    const a = normalizeUrl('https://example.com/page?b=2&a=1');
    const b = normalizeUrl('https://example.com/page?a=1&b=2');
    expect(a.normalized).toBe(b.normalized);
  });

  it('lowercases the host and strips a leading www for the domain', () => {
    const result = normalizeUrl('https://WWW.Example.COM/Path');
    expect(result.domain).toBe('example.com');
  });

  it('removes default ports', () => {
    const result = normalizeUrl('https://example.com:443/page');
    expect(result.normalized).toBe('https://example.com/page');
  });

  it('removes a trailing slash but keeps the bare root path', () => {
    expect(normalizeUrl('https://example.com/page/').normalized).toBe(
      'https://example.com/page',
    );
    expect(normalizeUrl('https://example.com/').normalized).toBe('https://example.com/');
  });

  it('removes the fragment', () => {
    expect(normalizeUrl('https://example.com/page#section').normalized).toBe(
      'https://example.com/page',
    );
  });

  it('treats equivalent URLs as identical after normalization', () => {
    const a = normalizeUrl('https://www.example.com/page/?utm_campaign=x&b=2&a=1#top');
    const b = normalizeUrl('https://example.com/page?a=1&b=2');
    expect(a.normalized).toBe(b.normalized);
  });

  it('flags unparseable input as invalid', () => {
    const result = normalizeUrl('not a url');
    expect(result.isValid).toBe(false);
  });

  it('passes through non-http(s) protocols unmodified aside from trimming', () => {
    const result = normalizeUrl('file:///Users/me/notes.txt');
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe('file:///Users/me/notes.txt');
  });
});

describe('extractDomain', () => {
  it('returns the registrable domain', () => {
    expect(extractDomain('https://blog.example.com/post')).toBe('blog.example.com');
    expect(extractDomain('https://www.example.com/post')).toBe('example.com');
  });
});
