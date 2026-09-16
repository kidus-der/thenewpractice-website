import Image from 'next/image'
import { MEDIA, type MediaKey } from '@/content/media'
import { cn } from '@/lib/cn'
import { plateQuality } from '@/lib/plates'

type Props = {
  media: MediaKey
  alt: string
  sizes: string
  className?: string
  priority?: boolean
  /**
   * Switching this from 'lazy' to 'eager' on a mounted image does start the
   * fetch — which is how the house carousel warms its plates a viewport ahead
   * without paying for them at page load.
   */
  loading?: 'eager' | 'lazy'
}

/** Media surface. Crop tightens on hover; the frame never grows. */
export function Plate({ media, alt, sizes, className, priority, loading }: Props) {
  const m = MEDIA[media]
  // Fail loudly at render rather than emit an <img> with no src. With the
  // generated manifest this branch is unreachable; with the stub it is the
  // only thing standing between a typo and a blank frame.
  if (!m) throw new Error(`Plate: no media entry for key "${String(media)}"`)
  return (
    <div className={cn('plate', className)}>
      <Image
        src={m.src}
        alt={alt}
        width={m.width}
        height={m.height}
        sizes={sizes}
        quality={plateQuality(media)}
        placeholder="blur"
        blurDataURL={m.blurDataURL}
        priority={priority}
        loading={loading}
      />
    </div>
  )
}
