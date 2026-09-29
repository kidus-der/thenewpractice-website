/**
 * The frame every email shares (round 1, R6; docs/EMAIL-SETUP.md).
 *
 * Email clients are not browsers: no CSS custom properties, no web fonts
 * worth trusting, no SVG in Gmail, <style> blocks stripped by some. So the
 * frame is tables with inline styles, the site's palette as values (PALETTE,
 * src/lib/tokens.ts, logged in CLAUDE.md §6a), the Didone named first with
 * safe serif fallbacks, hairlines as one-pixel borders, and the ceiba mark as
 * an inline attachment (cid:) so nothing is fetched from the network. No
 * tracking pixel, no remote image, no link but mailto: and tel:.
 *
 * Everything a person typed passes through `escapeHtml` before it touches
 * markup; the helpers here take text, never HTML, unless the parameter says
 * `Html`.
 */
import { PALETTE } from '@/lib/tokens'
import { MARK_PIXEL_HEIGHT, MARK_PIXEL_WIDTH } from './mark'

/** The Content-ID the mark travels under; the adapter attaches the PNG with it. */
export const MARK_CID = 'ceiba-mark'
export const MARK_SRC = `cid:${MARK_CID}`
/** Shown at a third of its pixel size, so it is sharp on dense screens. */
const MARK_WIDTH = Math.round(MARK_PIXEL_WIDTH / 3)
const MARK_HEIGHT = Math.round(MARK_PIXEL_HEIGHT / 3)

const SERIF = "'Bodoni Moda', Didot, 'Bodoni 72', 'Bodoni MT', 'Times New Roman', Georgia, serif"
const SANS = "Jost, 'Helvetica Neue', Helvetica, Arial, sans-serif"

const INK = PALETTE.canopy
const MUTED = PALETTE.stone
const RULE = PALETTE.clay
const PAPER = PALETTE.bone
const GROUND = PALETTE.sand

/** Joins a subject's prefix to what follows it: "Enquiry: Family". A colon, never a dash. */
export const SUBJECT_SEPARATOR = ': '

export type RenderedEmail = Readonly<{ subject: string; html: string; text: string }>

const ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Text to HTML: the five characters that could open markup or leave an attribute. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char)
}

/** Escaped text with its line breaks kept. */
export function escapeMultiline(value: string): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, '<br>')
}

/** Fills `{key}` tokens with values that are already safe for the target (escaped, or plain text). */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  )
}

const EYEBROW = `font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};`
const BODY = `font-family:${SANS};font-size:15px;line-height:24px;color:${INK};`
const LINK = `color:${INK};text-decoration:underline;`

/** A link a person can act on from the inbox: mailto: or tel:, escaped both ways. */
export function actionLink(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="${LINK}">${escapeHtml(label)}</a>`
}

/** A one-pixel rule across the column. */
const hairline = (top: number): string =>
  `<tr><td class="tnp-pad" style="padding:${top}px 48px 0 48px;"><div style="border-top:1px solid ${RULE};font-size:0;line-height:0;height:0;">&nbsp;</div></td></tr>`

/** A small letterspaced heading over a block. */
export const blockHeading = (text: string): string =>
  `<tr><td class="tnp-pad" style="padding:40px 48px 0 48px;${EYEBROW}">${escapeHtml(text)}</td></tr>`

export type DetailRow = Readonly<{ label: string; valueHtml: string }>

/** Label beside value, a hairline under each; stacks below 620px. */
export function detailRows(rows: readonly DetailRow[]): string {
  const body = rows
    .map(
      ({ label, valueHtml }) =>
        `<tr><td class="tnp-label" width="36%" valign="top" style="padding:14px 16px 14px 0;border-bottom:1px solid ${RULE};${EYEBROW}">${escapeHtml(label)}</td>` +
        `<td class="tnp-value" valign="top" style="padding:12px 0;border-bottom:1px solid ${RULE};${BODY}">${valueHtml}</td></tr>`
    )
    .join('')
  return `<tr><td class="tnp-pad" style="padding:16px 48px 0 48px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid ${RULE};">${body}</table></td></tr>`
}

/** A paragraph of body text, already escaped by the caller. */
export const paragraph = (html: string, top = 16): string =>
  `<tr><td class="tnp-pad" style="padding:${top}px 48px 0 48px;${BODY}">${html}</td></tr>`

/** A line in the display face (a band label, a result). */
export const displayLine = (text: string, top = 8): string =>
  `<tr><td class="tnp-pad" style="padding:${top}px 48px 0 48px;font-family:${SERIF};font-size:26px;line-height:32px;font-weight:400;color:${INK};">${escapeHtml(text)}</td></tr>`

export type NumberedRow = Readonly<{ numeral: string; text: string; answer: string }>

/** Numeral, question, answer: the answers list, one hairline per row. */
export function numberedRows(rows: readonly NumberedRow[]): string {
  const body = rows
    .map(
      ({ numeral, text, answer }) =>
        `<tr><td width="32" valign="top" style="padding:14px 8px 14px 0;border-bottom:1px solid ${RULE};font-family:${SANS};font-size:12px;line-height:24px;color:${MUTED};font-variant-numeric:tabular-nums;">${escapeHtml(numeral)}</td>` +
        `<td valign="top" style="padding:14px 16px 14px 0;border-bottom:1px solid ${RULE};${BODY}">${escapeHtml(text)}</td>` +
        `<td width="76" valign="top" align="right" style="padding:14px 0;border-bottom:1px solid ${RULE};${BODY}white-space:nowrap;">${escapeHtml(answer)}</td></tr>`
    )
    .join('')
  return `<tr><td class="tnp-pad" style="padding:16px 48px 0 48px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid ${RULE};">${body}</table></td></tr>`
}

export type LayoutParts = Readonly<{
  /** The document title; plain text. */
  title: string
  /** The hidden inbox preview line; plain text. */
  preheader: string
  eyebrow: string
  /** The heading in the display face; plain text. */
  heading: string
  /** The line under the heading; already escaped. */
  introHtml: string
  /** Table rows (from the helpers above). */
  bodyHtml: string
  /** The closing lines; already escaped. */
  footerHtml: readonly string[]
  /** The mark's source: `cid:` when sent, a data URI in the preview. */
  markSrc?: string
  /** Wordmark text, e.g. "THE NEW PRACTICE". */
  wordmark: string
}>

const HEAD_STYLE = `
  body { margin:0; padding:0; }
  a { color:${INK}; }
  @media only screen and (max-width:620px) {
    .tnp-pad { padding-left:24px !important; padding-right:24px !important; }
    .tnp-label, .tnp-value { display:block !important; width:100% !important; }
    .tnp-label { padding-bottom:0 !important; border-bottom:0 !important; }
    .tnp-heading { font-size:30px !important; line-height:36px !important; }
  }`

/** The whole message: ground, sheet, mark, wordmark, hairline, heading, body, footer. */
export function renderLayout(parts: LayoutParts): string {
  const markSrc = parts.markSrc ?? MARK_SRC
  const footer = parts.footerHtml
    .map(
      (line) =>
        `<tr><td class="tnp-pad" style="padding:8px 48px 0 48px;font-family:${SANS};font-size:12px;line-height:18px;color:${MUTED};">${line}</td></tr>`
    )
    .join('')
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<title>${escapeHtml(parts.title)}</title>
<style>${HEAD_STYLE}
</style>
</head>
<body style="margin:0;padding:0;background-color:${GROUND};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(parts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${GROUND}" style="background-color:${GROUND};">
<tr><td align="center" style="padding:32px 8px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" style="width:100%;max-width:600px;background-color:${PAPER};">
<tr><td class="tnp-pad" style="padding:44px 48px 0 48px;"><img src="${escapeHtml(markSrc)}" width="${MARK_WIDTH}" height="${MARK_HEIGHT}" alt="" style="display:block;border:0;outline:none;width:${MARK_WIDTH}px;height:${MARK_HEIGHT}px;"></td></tr>
<tr><td class="tnp-pad" style="padding:16px 48px 0 48px;font-family:${SERIF};font-size:13px;line-height:18px;letter-spacing:0.28em;color:${INK};">${escapeHtml(parts.wordmark)}</td></tr>
${hairline(28)}
<tr><td class="tnp-pad" style="padding:36px 48px 0 48px;${EYEBROW}">${escapeHtml(parts.eyebrow)}</td></tr>
<tr><td class="tnp-pad tnp-heading" style="padding:12px 48px 0 48px;font-family:${SERIF};font-size:36px;line-height:42px;font-weight:400;color:${INK};">${escapeHtml(parts.heading)}</td></tr>
<tr><td class="tnp-pad" style="padding:16px 48px 0 48px;font-family:${SANS};font-size:15px;line-height:24px;color:${MUTED};">${parts.introHtml}</td></tr>
${parts.bodyHtml}
${hairline(48)}
${footer}
<tr><td style="padding:0 0 44px 0;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`
}
