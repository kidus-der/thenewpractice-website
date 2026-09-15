/**
 * make-og.mjs — renders the Open Graph card to public/og.png.
 *
 * The link is going to be forwarded, and the preview card is the first thing
 * the second person to see it sees. A blank card undoes a lot of the work.
 *
 * The card is the client's reversed lockup on canopy: ceiba mark, wordmark,
 * brass rule, tagline. No location line — we were never told one.
 *
 * Set in Bodoni 72 — a system Didone from the family the identity specifies —
 * because librsvg cannot reach the webfont.
 *
 * Run: npm run og
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const W = 1200
const H = 630

const CANOPY = '#14231C'
const BONE = '#F1ECE0'
const BRASS = '#A9895C'

/** Same six strokes as src/components/Mark.tsx, in the mark's own 240-space. */
const STROKES = [
  'M 120 120 C 110 100 100 70 75 55',
  'M 120 120 L 120 40',
  'M 120 120 C 130 100 140 70 165 55',
  'M 120 120 C 112 140 105 165 85 195',
  'M 120 120 L 120 195',
  'M 120 120 C 128 140 135 165 155 195',
]

// Place the mark: its content spans x 75–165, y 40–195 in the 240-space.
const MARK_H = 132
const MARK_SCALE = MARK_H / 160
const MARK_W = 95 * MARK_SCALE
const MARK_X = W / 2 - MARK_W / 2
const MARK_Y = 108

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CANOPY}"/>

  <g transform="translate(${MARK_X} ${MARK_Y}) scale(${MARK_SCALE}) translate(-72.5 -37.5)"
     fill="none" stroke="${BONE}" stroke-width="4"
     stroke-linecap="round" stroke-linejoin="round">
    ${STROKES.map((d) => `<path d="${d}"/>`).join('\n    ')}
    <circle cx="120" cy="120" r="5.5" fill="${BRASS}" stroke="none"/>
  </g>

  <text x="${W / 2}" y="352" text-anchor="middle"
        font-family="Bodoni 72, Bodoni MT, Didot, serif" font-size="78"
        letter-spacing="12" fill="${BONE}">THE NEW PRACTICE</text>

  <rect x="${W / 2 - 95}" y="396" width="190" height="1" fill="${BRASS}"/>

  <text x="${W / 2}" y="440" text-anchor="middle"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="17"
        letter-spacing="4.4" fill="${BONE}" fill-opacity="0.72">PRIVATE TREATMENT WITHOUT COMPROMISE</text>
</svg>`

const out = join(process.cwd(), 'public', 'og.png')
await sharp(Buffer.from(svg)).png().toFile(out)
console.log(`Wrote ${W}×${H} → public/og.png`)

// Keep a copy of the source so the card can be re-cut without re-deriving it.
await writeFile(join(process.cwd(), 'design', 'og-card.svg'), svg, 'utf8')
console.log('Wrote design/og-card.svg')
