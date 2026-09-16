/**
 * Pure helpers for the travelling glow (docs/04 §6): the one light that moves
 * between the rows of a hairline list. The DOM-facing component in
 * `src/sections/RowGlow.tsx` measures a row and hands the numbers here.
 */

/** The four offsets a row reports against its positioned ancestor. */
export type OffsetBox = Readonly<{
  offsetLeft: number
  offsetTop: number
  offsetWidth: number
  offsetHeight: number
}>

/** Where the glow sits and how large it is, in the same coordinate space. */
export type GlowBox = Readonly<{ x: number; y: number; width: number; height: number }>

/**
 * The glow's box for a row: the row's own layout box, nothing more. The
 * bleed past the row — 10px above and below, the side bleed — is the
 * stylesheet's (padding on a content box with a matching negative margin),
 * so the script never has to know it.
 */
export function glowBox(row: OffsetBox): GlowBox {
  return {
    x: row.offsetLeft,
    y: row.offsetTop,
    width: row.offsetWidth,
    height: row.offsetHeight,
  }
}

/**
 * The active row after a row lets go (blur, pointer leaving the row): cleared
 * only when the row letting go is the one that holds the glow, so a blur that
 * arrives after the next row has already taken it changes nothing.
 */
export function releaseRow(current: number | null, index: number): number | null {
  return current === index ? null : current
}
