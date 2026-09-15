import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from '@/lib/og'

/**
 * The site's default Open Graph image: the lockup on canopy, no title line.
 * Generated once at build. Pages that call buildMetadata() point at /og with
 * their own title instead; this is the fallback for any route that does not.
 */
export const alt = OG_ALT
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return renderOgCard({})
}
