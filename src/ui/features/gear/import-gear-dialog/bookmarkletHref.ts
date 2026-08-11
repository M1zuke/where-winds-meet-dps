export const BOOKMARKLET_SCHEME = "javascript:"

// Percent-encoding is load-bearing, not cosmetic: an unescaped `#` truncates the
// URL at a fragment and an unescaped `%` misparses.
export function bookmarkletHref(source: string): string {
  return BOOKMARKLET_SCHEME + encodeURIComponent(source)
}
