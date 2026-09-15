/**
 * The plate a profile shows until the client supplies portraits (docs/02
 * §Media, docs/CONTENT-GAPS.md G4). A 3:4 frame on sand carrying one
 * vertical hairline and the ceiba's gold point at the golden section: the
 * human presence only obliquely — never a face, not even an outline of one.
 * Server-rendered SVG; every colour is a token read from the ground it sits
 * on, so the same markup would grade correctly on sand or canopy. The label
 * is interface copy from ui.ts and is replaced by the portrait's own alt
 * text when `media.ts` gains a key for the member.
 */
import './PortraitPlaceholder.css'
import { UI_PROFILE } from '@/content/ui'
import { cn } from '@/lib/cn'

/** The point sits at the upper golden section of the frame, not its centre. */
const GOLDEN_SECTION = 1 - 0.618
const POINT_CY = `${(GOLDEN_SECTION * 100).toFixed(1)}%`
/** The mark's point is 6px across at plate scale; r is in px because the SVG has no viewBox. */
const POINT_RADIUS = 3
const GRADIENT_ID = 'portrait-placeholder-ground'

type Props = { className?: string }

export function PortraitPlaceholder({ className }: Props) {
  return (
    <svg
      className={cn('portrait-placeholder', className)}
      role="img"
      aria-label={UI_PROFILE.portraitPending}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="portrait-placeholder__stop-top" />
          <stop offset="1" className="portrait-placeholder__stop-foot" />
        </linearGradient>
      </defs>
      <rect className="portrait-placeholder__ground" width="100%" height="100%" />
      <rect width="100%" height="100%" fill={`url(#${GRADIENT_ID})`} />
      <line className="portrait-placeholder__line" x1="50%" y1="0" x2="50%" y2="100%" />
      <circle className="portrait-placeholder__point" cx="50%" cy={POINT_CY} r={POINT_RADIUS} />
    </svg>
  )
}
