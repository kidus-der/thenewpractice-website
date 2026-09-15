# 08 — Asset Pipeline

## The constraint

The client has not yet supplied photography, video, voice-over or team portraits. The templates must nevertheless be judged with real media in them — grey boxes make everyone over-estimate a composition. So, by owner decision: **everything is licence-free stock**, chosen to match the practice, graded into one look, and logged so that every file's provenance is known when the client's own material replaces it.

## Hard rules

| Rule | |
| --- | --- |
| **Never** use an image from Küsnacht Practice, Paracelsus, Clinic Les Alpes, or any competing practice | Instantly recognisable to this client. Fatal. |
| **Never** use an image of an identifiable real hotel, resort or private residence | Implies a claim about a place, and the residences page is privacy-first |
| **Never** use an image with an identifiable face | Violates the premise and creates a model-release problem |
| **Never** use AI-generated imagery of people or places | Uncanny at this tier, and dishonest in a medical context. Generated **silhouettes** for team placeholders are the one exception: abstract, faceless, unmistakably placeholders. |
| **Always** record source URL, licence name and licence URL for every asset in `design/ASSETS.md` | If it is not in the manifest it is not on the site |
| **Always** normalise every still through the same grade | Consistency is what makes sourced photography read as commissioned |

## Sourcing

**Sources:** Pexels, Pixabay, Mixkit, Coverr — all free for commercial use without attribution. Attribution is recorded anyway. The researched shortlist with two to three candidates per slot is `design/STOCK-SOURCES.md` (task 2a); the chosen files and their download URLs are `design/media.manifest.json`, which drives the pipeline (task 2b).

**Slots:**

| Slot | Ratio | Subject |
| --- | --- | --- |
| Hero video | 16:9, ≥ 1080p, 10–30s, loopable | (a) gentle Caribbean surf at dawn, no people; (b) dense jungle canopy with slow movement or mist; (c) cenote or still water with light. The client's brief: *surf, jungle beginning to emerge* — a surf clip and a canopy clip, trimmed to one seamless loop. |
| Hero poster | 16:9 | A frame from the chosen clip, through the still pipeline |
| Residence plates × 6 | 3:4 | Corridor or doorway with light · linen bed unoccupied · limestone or plaster close-up · terrace to canopy · still water · shaded pool edge |
| Index plates × 4 | 3:4 | Jungle · sea · stone · leaf with rain |
| Discretion band | 21:9 | Figure turned away, or an empty room |
| Team portraits × 11 | 3:4 | **Not sourced.** Generated silhouette placeholders until the client's portraits arrive. |

Search for the *materials and weather* of the place — `rain on tropical leaf`, `jungle canopy from below`, `cenote`, `limestone wall`, `linen bed morning light`, `tropical modernism interior` — never for the destination. `tulum`, `riviera maya`, `cancun` return resort photography, which is the exact wrong register.

**Reject on sight:** anything alpine or temperate, resort-branded, with faces, lotus, candles, hot stones, lens flare, turquoise-water clichés, ruins as backdrop.

## The grade — a brand duotone

Every still is mapped into the identity's two-colour range before it enters `public/media/`. Not desaturated — **duotoned**: canopy green in the shadows, bone in the highlights, nothing outside them.

```
1. Exposure     per-frame trim (ev), then contrast ×0.95 and a global −22 offset
2. Desaturate   saturation → 0, keeping three bands
3. Map          grey → lerp(SHADOW, HIGHLIGHT)
                SHADOW    #182A21   a *lifted* canopy green
                HIGHLIGHT #E9E2D3   a slightly-held-back bone
4. Sharpening   none (the grain overlay does this work)
```

Two things learned building it in the concept site, both kept:

- **Lift the shadow point.** Mapping straight to the identity's `#14231C` crushes the dark end to near-black and the green never reads. `#182A21` is what makes the duotone legible as a colour decision.
- **Per-frame exposure is not optional.** One global curve leaves the airy frames washed out and the dark ones muddy. `ev` in the manifest is a trim in 0–255 units.

**Video** is graded toward the same range in ffmpeg (a lift, a desaturation, a tint toward canopy) but keeps a little of its own colour so surf still reads as water. It is judged next to the stills; if it fights them, it is graded harder.

Do the grade once, in one script, with the same settings. Never grade image-by-image to taste. When the client's commissioned photography arrives, revisit: with the right frames a lighter grade may serve better, and the duotone should be a choice rather than a patch.

## The pipeline

`scripts/prepare-assets.mjs` (`npm run assets`), extended in task 2b:

1. Read `design/media.manifest.json` — key, source URL, target size, crop position, `ev`, licence fields
2. Fetch each still; resize, expose, duotone with `sharp`
3. Write AVIF (`quality 55, effort 6`) + WebP (`quality 78`) to `public/media/`
4. Write a 20px WebP LQIP per frame
5. Regenerate `src/content/media.ts` — an `as const` manifest of `{ src, width, height, blurDataURL }` keyed by frame; `<Plate>` reads it and fails loudly on an unknown key
6. Video: download the chosen clips, transcode with ffmpeg to `public/video/hero-loop.mp4` (H.264, CRF ~26, ≤ 4 MB) and `.webm` (VP9, `-b:v 0 -crf 34`) at 1920×1080, audio stripped (`-an`), trimmed to a seamless loop; extract the poster frame and pass it through the still pipeline
7. Write `design/ASSETS.md`

`scripts/make-og.mjs` (`npm run og`) renders the static lockup card to `public/og.png` and `design/og-card.svg`; task 10's `opengraph-image.tsx` supersedes it per page.

## Formats and sizes

| Asset | Format | Budget |
| --- | --- | --- |
| Hero poster | AVIF + WebP, 2400 wide | ≤ 180kB |
| Hero video | MP4 (H.264) + WebM (VP9), 1920×1080, 10–30s loop, no audio | **≤ 4MB** mp4, `preload="metadata"` |
| Plates (3:4) | AVIF + WebP, 1040 wide | ≤ 120kB each |
| Band (21:9) | AVIF + WebP, 2100 wide | ≤ 150kB |
| Team plates | SVG silhouettes (generated) | ≤ 4kB each |
| Grain texture | inline SVG `feTurbulence` | ≤ 2kB |

Initial-viewport media weight (poster + fonts) must stay under **1.6MB**. The video loads after the poster paints; the LCP is the poster, never the video.

**LQIP:** every `next/image` gets a `blurDataURL`. The blur-up is part of the art direction — images develop rather than pop in.

## Video specifics

- One continuous slow shot per clip; the loop point tested at 0.5× speed — a visible seam is the first thing a designer-adjacent client will notice
- `muted playsinline loop preload="metadata"` with a real poster; the poster is the LCP
- **Do not load at all** when `prefers-reduced-motion: reduce` or `navigator.connection.saveData`; show the poster
- The ambient gradient sits behind the video at 0.35 opacity on eligible desktops; the video is never transparent enough to depend on it

## Fonts

Self-hosted via `next/font/google`. No external requests.

| Face | Weights | Subset | Preload |
| --- | --- | --- | --- |
| Bodoni Moda | 400, 500, + italics | latin, latin-ext | yes |
| Jost | variable | latin, latin-ext | no |

Typeface licensing is the client's (contract §3). The swap point is `src/app/layout.tsx`.

## Audio

The client specifies a warm voice-over over the hero video (script in `pages/home.ts`). Until the recording exists, `pages/home.ts` has no `audioSrc` and the *Listen* toggle does not render. When it arrives: `/public/audio/`, mono, ≤ 300kB, loaded **only** on first activation, fades in over 1.2s and out over 0.6s, default off, `aria-pressed` on the button. Never autoplays.

## Asset manifest

`design/ASSETS.md`, one row per file:

```
| File | Slot | Source | Source URL | Licence | Licence URL | Grade (ev) |
```

Plus a *Rejected* table with the reason, and a *Not present* list (voice-over, portraits, commissioned photography). This is not bureaucracy: the moment the site is live, unlicensed assets are a legal problem, and by then no one remembers where anything came from.

## Placeholder discipline

Do not build templates against grey boxes. Real, graded stock from the first commit; swap for the client's material later. The layout is judged with photography in it.
