import { cn } from '@/lib/cn'

/**
 * The ceiba mark — the client's identity, geometry lifted directly from the
 * vector in "The New Practice - Logo Concept.pdf".
 *
 * The ceiba is the Maya world tree, joining the underworld, the earthly plane
 * and the heavens through one trunk. Three branches rise, three roots descend,
 * and all six meet at a single point: one guest, one team, one purpose. The
 * gold point at that intersection is the only accent colour in the identity —
 * it marks "the one" every time it appears. Do not recolour it, do not add a
 * second accent, do not use the mark without it.
 *
 * Every stroke starts at the centre (120,120) and travels outward, so a
 * stroke-dashoffset draw always grows *from* the point rather than toward it.
 * That is the whole reason the paths are authored this way — keep it.
 */

const BRANCHES = [
  'M 120 120 C 110 100 100 70 75 55',
  'M 120 120 L 120 40',
  'M 120 120 C 130 100 140 70 165 55',
]

const ROOTS = [
  'M 120 120 C 112 140 105 165 85 195',
  'M 120 120 L 120 195',
  'M 120 120 C 128 140 135 165 155 195',
]

type Props = {
  className?: string
  /** Renders the strokes ready to be drawn on by GSAP rather than complete. */
  animated?: boolean
  title?: string
}

export function Mark({ className, animated = false, title }: Props) {
  return (
    <svg
      className={cn('mark', animated && 'mark--animated', className)}
      viewBox="72.5 37.5 95 160"
      fill="none"
      stroke="currentColor"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {BRANCHES.map((d) => (
        <path key={d} className="mark__stroke mark__branch" d={d} pathLength={1} />
      ))}
      {ROOTS.map((d) => (
        <path key={d} className="mark__stroke mark__root" d={d} pathLength={1} />
      ))}
      <circle
        className="mark__point"
        cx={120}
        cy={120}
        r={5.5}
        fill="var(--c-brass)"
        stroke="none"
      />
    </svg>
  )
}
