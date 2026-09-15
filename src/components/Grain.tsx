/**
 * Global texture. docs/02-art-direction.md §Texture.
 * Static tiled turbulence — never animated. Sits above the overlay layer so
 * the grain stays continuous across everything.
 */
const NOISE = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='180' height='180' filter='url(#n)'/></svg>`

export function Grain() {
  const url = `url("data:image/svg+xml,${encodeURIComponent(NOISE)}")`
  return (
    <div className="texture" aria-hidden="true">
      <div className="texture__grain" style={{ '--grain-url': url } as React.CSSProperties} />
      <div className="texture__vignette" />
    </div>
  )
}
