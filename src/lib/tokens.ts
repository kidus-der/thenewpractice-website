/**
 * Runtime access to design tokens. docs/03-design-system.md.
 *
 * The CSS custom properties in globals.css are the single source of truth.
 * Code that needs a token as a *value* — a WebGL uniform, a colour written to
 * <html> by the GroundManager — reads it from the document at call time
 * through readToken(), so the palette can change in one place.
 *
 * PALETTE mirrors the core palette for two callers only: the fallback passed
 * to readToken() when the document is unavailable (server render, tests), and
 * nothing else. Components never import PALETTE to paint with; they use the
 * CSS variables. This mirror is logged in CLAUDE.md §6a.
 */

/** Core palette fallbacks — mirrors :root in globals.css. Keep in step. */
export const PALETTE = {
  canopy: '#14231c',
  canopySoft: '#1c2e25',
  bone: '#f1ece0',
  sand: '#e3dccb',
  clay: '#c8b9a0',
  stone: '#566059',
  brass: '#a9895c',
} as const

/** Reads one custom property's raw value, or undefined when it cannot. */
export type TokenReader = (name: string) => string | undefined

const documentReader: TokenReader = (name) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined
  return window.getComputedStyle(document.documentElement).getPropertyValue(name)
}

/**
 * Reads a CSS custom property (`--c-canopy`) from the root element at call
 * time. Returns `fallback` on the server, before the stylesheet has applied,
 * or when the property is unset. Pass a `reader` to test without a DOM.
 */
export function readToken(
  name: string,
  fallback: string,
  reader: TokenReader = documentReader
): string {
  if (!name.startsWith('--')) return fallback
  const value = reader(name)?.trim()
  return value ? value : fallback
}
