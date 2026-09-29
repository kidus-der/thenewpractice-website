/**
 * The picture beside each home section (round 1, R3; docs/05 §T1). The
 * house PlateFigure (one `mask` reveal, the photographer's credit beneath)
 * at the `.p-aside` width from 1024px and a capped portrait below it, so a
 * section is a few lines and one frame at every width. The route chooses the
 * frames; the alt text is the frame's own, from media.ts. Server component.
 */
import './HomePlate.css'
import type { MediaKey } from '@/content/media'
import { cn } from '@/lib/cn'
import { PlateFigure } from '@/sections/PlateFigure'

/** Four of twelve columns from 1024px (≈ 30vw, 515px at the 1720px cap); capped below. */
export const HOME_PLATE_SIZES =
  '(min-width: 1920px) 520px, (min-width: 1024px) 30vw, (min-width: 768px) 360px, 62vw'

type Props = Readonly<{ media: MediaKey; className?: string }>

export function HomePlate({ media, className }: Props) {
  return (
    <PlateFigure media={media} sizes={HOME_PLATE_SIZES} className={cn('home-plate', className)} />
  )
}
