/**
 * Query parameters that only carry tracking/analytics context and never affect
 * the resource a URL resolves to. Safe to strip during normalization.
 */
const TRACKING_PARAM_PATTERNS: RegExp[] = [
  /^utm_/i,
  /^(gclid|dclid|gbraid|wbraid)$/i,
  /^fbclid$/i,
  /^msclkid$/i,
  /^mc_(cid|eid)$/i,
  /^igshid$/i,
  /^yclid$/i,
  /^_ga$/i,
  /^_hs(enc|mi)?$/i,
  /^ref(_src|_url)?$/i,
  /^spm$/i,
  /^si$/i,
  /^vero_(id|conv)$/i,
  /^oly_(anon|enc)_id$/i,
  /^wickedid$/i,
];

const DEFAULT_PORTS: Record<string, string> = {
  'http:': '80',
  'https:': '443',
};

function isTrackingParam(key: string): boolean {
  return TRACKING_PARAM_PATTERNS.some((pattern) => pattern.test(key));
}

export interface NormalizedUrl {
  /** Fully normalized URL suitable for storage, dedupe, and display. */
  normalized: string;
  /** Lowercased registrable host, e.g. "example.com". */
  domain: string;
  /** Whether the input could be parsed as a URL at all. */
  isValid: boolean;
}

/**
 * Normalizes a bookmark URL for consistent storage, search, and duplicate
 * detection: lowercases the host, strips default ports, removes tracking
 * query parameters, sorts remaining ones, drops trailing slashes and
 * fragments, and removes a bare "www." prefix.
 */
export function normalizeUrl(rawUrl: string): NormalizedUrl {
  const trimmed = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { normalized: trimmed, domain: '', isValid: false };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { normalized: trimmed, domain: parsed.hostname, isValid: true };
  }

  // A bare "www." prefix is treated as the same site for both the
  // normalized URL and the extracted domain, which keeps http(s)+www
  // variants of the same page from being treated as distinct bookmarks.
  const domain = parsed.hostname.toLowerCase().replace(/^www\./, '');
  parsed.hostname = domain;

  if (DEFAULT_PORTS[parsed.protocol] === parsed.port) {
    parsed.port = '';
  }

  const keptParams: [string, string][] = [];
  for (const [key, value] of parsed.searchParams.entries()) {
    if (!isTrackingParam(key)) {
      keptParams.push([key, value]);
    }
  }
  keptParams.sort(([a], [b]) => a.localeCompare(b));
  parsed.search = '';
  for (const [key, value] of keptParams) {
    parsed.searchParams.append(key, value);
  }

  parsed.hash = '';

  let pathname = parsed.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  parsed.pathname = pathname || '/';

  const protocolAndHost = `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`;
  const search = parsed.search;
  const normalized = `${protocolAndHost}${parsed.pathname}${search}`;

  return { normalized, domain, isValid: true };
}

export function extractDomain(url: string): string {
  return normalizeUrl(url).domain;
}
