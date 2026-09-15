/**
 * An inline plate for the long-read templates (docs/05 §T2, docs/02
 * §Treatment). One of the three standing ratios, inferred from the frame's own
 * proportions in media.ts; a single `mask` reveal; the caption, when the page
 * supplies one, and the photographer's credit from the manifest beneath.
 * Server component; the reveal is the only client code.
 */
import './PlateFigure.css'
import { MEDIA, type MediaKey } from '@/content/media'
import { Plate } from '@/components/Plate'
import { plateRatio } from '@/lib/interior'
import { Reveal } from '@/motion/Reveal'
import { cn } from '@/lib/cn'

type Props = {
  media: MediaKey
  /** `sizes` for next/image, from the block that knows the column. */
  sizes: string
  caption?: string
  className?: string
}

export function PlateFigure({ media, sizes, caption, className }: Props) {
  const frame = MEDIA[media]
  const ratio = plateRatio(frame.width, frame.height)
  return (
    <figure className={cn('plate-figure', className)} data-ratio={ratio}>
      <Reveal variant="mask" className="plate-figure__frame">
        <Plate media={media} alt={frame.alt} sizes={sizes} className="plate-figure__plate" />
      </Reveal>
      <figcaption className="plate-figure__caption t-small">
        {caption && <span>{caption}</span>}
        <span className="plate-figure__credit t-eyebrow">{frame.credit}</span>
      </figcaption>
    </figure>
  )
}
