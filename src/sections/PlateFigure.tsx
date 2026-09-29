/**
 * An inline plate for the long-read templates (docs/05 §T2, docs/02
 * §Treatment). One of the three standing ratios, inferred from the frame's own
 * proportions in media.ts; a single `mask` reveal; the caption beneath, when
 * the page supplies one. No photographer credit renders (owner decision, round
 * 1); credits stay in media.ts and design/ASSETS.md.
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
  /** A plate in the first viewport (a title page's) loads at once. */
  priority?: boolean
}

export function PlateFigure({ media, sizes, caption, className, priority }: Props) {
  const frame = MEDIA[media]
  const ratio = plateRatio(frame.width, frame.height)
  return (
    <figure className={cn('plate-figure', className)} data-ratio={ratio}>
      <Reveal variant="mask" className="plate-figure__frame">
        <Plate
          media={media}
          alt={frame.alt}
          sizes={sizes}
          className="plate-figure__plate"
          priority={priority}
        />
      </Reveal>
      {caption && <figcaption className="plate-figure__caption t-small">{caption}</figcaption>}
    </figure>
  )
}
