/**
 * The Open Graph card — the client's reversed lockup on canopy: ceiba mark,
 * wordmark, brass rule, tagline; optionally the page's short title in bone at
 * the foot. Composition follows design/og-card.svg (the static card from
 * scripts/make-og.mjs), which this supersedes.
 *
 * Rendered by app/opengraph-image.tsx (the site default, static) and by
 * app/og/route.tsx (`?title=`, per page). Fonts are the site's stand-ins,
 * Bodoni Moda and Jost, fetched from Google Fonts as TTF subsets at render
 * time (the pattern in the Next docs) and memoised per process. If that fetch
 * fails the card still renders with the runtime's bundled sans and the
 * response says so in an `x-og-fonts` header, so a bad card is diagnosable
 * without a console.
 *
 * Pixel values here are image geometry on a fixed 1200×630 canvas, not CSS;
 * colours come from the token mirror (CLAUDE.md §6a).
 */
import { ImageResponse } from 'next/og'

import { BRAND } from '@/content/brand'
import { SEO_DEFAULTS } from '@/content/seo'
import { PALETTE } from '@/lib/tokens'

export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = 'image/png'
export const OG_ALT = SEO_DEFAULTS.ogImageAlt

const FONT = { display: 'Bodoni Moda', text: 'Jost' } as const
const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com/css2'
const FONT_SRC = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/

/** Same six strokes as src/components/Mark.tsx, in the mark's own 240-space. */
const STROKES = [
  'M 120 120 C 110 100 100 70 75 55',
  'M 120 120 L 120 40',
  'M 120 120 C 130 100 140 70 165 55',
  'M 120 120 C 112 140 105 165 85 195',
  'M 120 120 L 120 195',
  'M 120 120 C 128 140 135 165 155 195',
] as const

const MARK = { viewBox: '72.5 37.5 95 160', width: 78, height: 132, top: 108, stroke: 4 }
const WORDMARK = { top: 286, size: 78, tracking: 12 }
const RULE = { top: 396, width: 190, height: 1 }
const TAGLINE = { top: 426, size: 17, tracking: 4.4, opacity: 0.72 }
const TITLE = { top: 520, size: 34, tracking: 0.5, maxWidth: 1040 }

type FontData = { name: string; data: ArrayBuffer; weight: 400; style: 'normal' }

const fontCache = new Map<string, Promise<ArrayBuffer>>()

/** One TTF subset covering `text`, from the Google Fonts CSS API. */
async function fetchGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  const params = new URLSearchParams({ family, text })
  const css = await fetch(`${GOOGLE_FONTS_CSS}?${params}`).then((r) => r.text())
  const source = FONT_SRC.exec(css)?.[1]
  if (!source) throw new Error(`No TrueType source for ${family} in the Google Fonts response`)
  const response = await fetch(source)
  if (!response.ok) throw new Error(`Font fetch failed for ${family}: ${response.status}`)
  return response.arrayBuffer()
}

const memoisedFont = (family: string, text: string): Promise<ArrayBuffer> => {
  const key = `${family}:${text}`
  const cached = fontCache.get(key)
  if (cached) return cached
  const pending = fetchGoogleFont(family, text)
  fontCache.set(key, pending)
  pending.catch(() => fontCache.delete(key))
  return pending
}

/** Display face for wordmark and title, text face for the tagline; empty on failure. */
async function loadFonts(title: string | undefined): Promise<readonly FontData[]> {
  const displayText = `${BRAND.nameUpper}${title ?? ''}`
  const textText = BRAND.tagline.toUpperCase()
  try {
    const [display, text] = await Promise.all([
      memoisedFont(FONT.display, displayText),
      memoisedFont(FONT.text, textText),
    ])
    return [
      { name: FONT.display, data: display, weight: 400, style: 'normal' },
      { name: FONT.text, data: text, weight: 400, style: 'normal' },
    ]
  } catch {
    return []
  }
}

type CardProps = { title?: string; displayFont: string; textFont: string }

function Card({ title, displayFont, textFont }: CardProps) {
  const centred = { position: 'absolute' as const, left: 0, right: 0, display: 'flex' as const }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: PALETTE.canopy,
        color: PALETTE.bone,
      }}
    >
      <div style={{ ...centred, top: MARK.top, justifyContent: 'center' }}>
        <svg
          viewBox={MARK.viewBox}
          width={MARK.width}
          height={MARK.height}
          fill="none"
          stroke={PALETTE.bone}
          strokeWidth={MARK.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {STROKES.map((d) => (
            <path key={d} d={d} />
          ))}
          <circle cx={120} cy={120} r={5.5} fill={PALETTE.brass} stroke="none" />
        </svg>
      </div>

      <div
        style={{
          ...centred,
          top: WORDMARK.top,
          justifyContent: 'center',
          fontFamily: displayFont,
          fontSize: WORDMARK.size,
          letterSpacing: WORDMARK.tracking,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {BRAND.nameUpper}
      </div>

      <div style={{ ...centred, top: RULE.top, justifyContent: 'center' }}>
        <div style={{ width: RULE.width, height: RULE.height, background: PALETTE.brass }} />
      </div>

      <div
        style={{
          ...centred,
          top: TAGLINE.top,
          justifyContent: 'center',
          fontFamily: textFont,
          fontSize: TAGLINE.size,
          letterSpacing: TAGLINE.tracking,
          lineHeight: 1,
          opacity: TAGLINE.opacity,
          whiteSpace: 'nowrap',
        }}
      >
        {BRAND.tagline.toUpperCase()}
      </div>

      {title ? (
        <div style={{ ...centred, top: TITLE.top, justifyContent: 'center' }}>
          <div
            style={{
              maxWidth: TITLE.maxWidth,
              fontFamily: displayFont,
              fontSize: TITLE.size,
              letterSpacing: TITLE.tracking,
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            {title}
          </div>
        </div>
      ) : null}
    </div>
  )
}

type RenderOptions = {
  title?: string
  /** Extra response headers (the per-page route sets its cache policy). */
  headers?: Readonly<Record<string, string>>
}

/** The finished 1200×630 PNG response. */
export async function renderOgCard({ title, headers = {} }: RenderOptions): Promise<ImageResponse> {
  const fonts = await loadFonts(title)
  const loaded = fonts.length > 0
  return new ImageResponse(
    <Card
      title={title}
      displayFont={loaded ? FONT.display : 'serif'}
      textFont={loaded ? FONT.text : 'sans-serif'}
    />,
    {
      ...OG_SIZE,
      fonts: [...fonts],
      headers: { ...headers, 'x-og-fonts': loaded ? 'google' : 'fallback' },
    }
  )
}
