# 08 — Asset Pipeline

## The constraint

The client has not yet supplied photography, video, voice-over or team portraits. The templates must nevertheless be judged with real media in them — grey boxes make everyone over-estimate a composition. So, by owner decision: **everything is licence-free stock**, chosen to match the practice, graded into one look, and logged so that every file's provenance is known when the client's own material replaces it.

## Hard rules

| Rule                                                                                                   |                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Never** use an image from Küsnacht Practice, Paracelsus, Clinic Les Alpes, or any competing practice | Instantly recognisable to this client. Fatal.                                                                                                                                   |
| **Never** use an image of an identifiable real hotel, resort or private residence                      | Implies a claim about a place, and the residences page is privacy-first                                                                                                         |
| **Never** use an image with an identifiable face                                                       | Violates the premise and creates a model-release problem                                                                                                                        |
| **Never** use AI-generated imagery of people or places                                                 | Uncanny at this tier, and dishonest in a medical context. Generated **silhouettes** for team placeholders are the one exception: abstract, faceless, unmistakably placeholders. |
| **Always** record source URL, licence name and licence URL for every asset in `design/ASSETS.md`       | If it is not in the manifest it is not on the site                                                                                                                              |
| **Always** normalise every still through the same grade                                                | Consistency is what makes sourced photography read as commissioned                                                                                                              |

## Sourcing

**Sources:** Pexels, Pixabay, Mixkit, Coverr — all free for commercial use without attribution. Attribution is recorded anyway. The researched shortlist with two to three candidates per slot is `design/STOCK-SOURCES.md` (task 2a); the chosen files, their download URLs and every per-file setting are `design/media.manifest.json`, which drives the pipeline (task 2b). The register of what shipped is `design/ASSETS.md`.

**Slots:**

| Slot                 | Ratio                           | Subject                                                                                                                                                                                                                                                            |
| -------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hero video           | 16:9, ≥ 1080p, 10–30s, loopable | (a) gentle Caribbean surf at dawn, no people; (b) dense jungle canopy with slow movement or mist; (c) cenote or still water with light. The client's brief: _surf, jungle beginning to emerge_ — a surf clip and a canopy clip, each trimmed to one seamless loop. |
| Hero poster          | 16:9                            | A frame from the chosen clip, through the still pipeline; plus one photographed alternative                                                                                                                                                                        |
| Residence plates × 6 | 3:4                             | Corridor or doorway with light · linen bed unoccupied · limestone or plaster close-up · terrace to canopy · still water · shaded stone steps                                                                                                                       |
| Index plates × 4     | 3:4                             | Jungle · sea · stone · leaf with rain                                                                                                                                                                                                                              |
| Discretion band      | 21:9                            | Figure turned away, or an empty room                                                                                                                                                                                                                               |
| Team portraits × 11  | 3:4                             | **Not sourced.** Generated silhouette placeholders until the client's portraits arrive.                                                                                                                                                                            |

Search for the _materials and weather_ of the place — `rain on tropical leaf`, `jungle canopy from below`, `cenote`, `limestone wall`, `linen bed morning light`, `tropical modernism interior` — never for the destination. `tulum`, `riviera maya`, `cancun` return resort photography, which is the exact wrong register.

**Reject on sight:** anything alpine or temperate, resort-branded, with faces, lotus, candles, hot stones, lens flare, turquoise-water clichés, ruins as backdrop.

## The grade — a brand duotone

Every still is mapped into the identity's two-colour range before it enters `public/media/`. Not desaturated — **duotoned**: canopy green in the shadows, bone in the highlights, nothing outside them.

```
1. Crop         to the slot's aspect; sharp's attention strategy, or the manifest's `focus`
2. Exposure     per-frame trim (ev), then contrast ×0.95 and a global −22 offset
3. Desaturate   saturation → 0, keeping three bands
4. Map          grey → lerp(SHADOW, HIGHLIGHT)
                SHADOW    #182A21   a *lifted* canopy green
                HIGHLIGHT #E9E2D3   a slightly-held-back bone
5. Sharpening   none (the grain overlay does this work)
```

Two things learned building it in the concept site, both kept:

- **Lift the shadow point.** Mapping straight to the identity's `#14231C` crushes the dark end to near-black and the green never reads. `#182A21` is what makes the duotone legible as a colour decision.
- **Per-frame exposure is not optional.** One global curve leaves the airy frames washed out and the dark ones muddy. `ev` in the manifest is a trim in 0–255 units; the duotone floor is luminance 38, so a frame whose 5th percentile sits at 38 is crushed and wants a positive `ev`; a frame whose median sits above 130 is airy and wants a negative one. The values that shipped are in `design/ASSETS.md`.

**Video** is graded toward the same range in ffmpeg but keeps some of its own colour so surf still reads as water:

```
curves        all='0/0.06 0.25/0.27 0.75/0.74 1/0.95'   lift blacks, roll off highlights
eq            saturation=0.6 contrast=0.95               desaturate ~40 %
colorbalance  shadows and mids cooled toward canopy      rs −0.06 gs +0.05 bs −0.02 / rm −0.04 gm +0.03 bm −0.02
hqdn3d        1.5:1.5:5:5                                mild temporal denoise; for bitrate, not look
```

It is judged next to the stills; if it fights them, it is graded harder. Do the grade once, in one script, with the same settings. Never grade image-by-image to taste beyond `ev`. When the client's commissioned photography arrives, revisit: with the right frames a lighter grade may serve better, and the duotone should be a choice rather than a patch.

## The pipeline

Two scripts, both driven by `design/media.manifest.json`, run in this order:

```
node scripts/prepare-video.mjs     # needs ffmpeg + ffprobe on PATH (brew install ffmpeg)
node scripts/prepare-assets.mjs    # npm run assets
```

Downloads are cached under `node_modules/.cache/tnp-media/` (ignored with `node_modules`); every fetch sends a browser-like `User-Agent` because the Pexels page hosts refuse plain clients.

### `prepare-video.mjs` — one loop per `video[]` entry

1. Fetch the source to the cache; `ffprobe` it and refuse if `trimStart + trimSeconds + loopSeconds` exceeds the clip
2. `-ss trimStart -t trimSeconds + loopSeconds`, scale with `force_original_aspect_ratio=increase` and crop to 1920×1080
3. Close the loop: `main = S[d … L+d]`, `head = S[0 … d]`, `xfade` main into head over the last `d` seconds. The output's first frame is `S[d]` and its last frame has faded fully into `S[d]`, so the join is invisible. Verify by extracting the first and last frames side by side.
4. Apply the video grade above, `format=yuv420p`
5. Encode `public/video/<key>.mp4`: `libx264 -crf 24 -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart -an`; a manifest `crf` overrides the 24 when the source's noise will not fit the 4 MB budget
6. Encode `public/video/<key>.webm`: `libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -an`; a manifest `webmCrf` overrides the 34
7. Extract the poster frame at 1 s from the finished mp4 to `node_modules/.cache/tnp-media/posters/<key>-poster.png`
8. Pass key names as arguments to re-encode a subset: `node scripts/prepare-video.mjs hero-surf`

### `prepare-assets.mjs` — every `stills[]` entry, then every cached poster

1. Validate the manifest (key, https URL, aspect ∈ 3:4 / 16:9 / 1:1 / 21:9, numeric `ev`, optional `focus` ∈ top / centre / bottom, required `alt`, `credit`, `licence`)
2. Fetch each still to the cache; crop, expose, duotone with `sharp` at the slot size: 16:9 → 2400×1350, 3:4 → 1040×1387, 1:1 → 1200×1200, 21:9 → 2100×900
3. Write AVIF (`quality 55, effort 6`) + WebP (`quality 78`) to `public/media/<key>.{avif,webp}`
4. Write a 20 px WebP LQIP per frame
5. Poster frames found in the cache go through the same grade as `<key>-poster`, 16:9, with the video entry's `posterEv`
6. Regenerate `src/content/media.ts`: `MEDIA` (`as const`, keyed by frame: `src`, `width`, `height`, `blurDataURL`, `alt`, `credit`, `licence`) and `VIDEO` (keyed by clip: `mp4`, `webm`, `poster` MediaKey, `width`, `height`, `seconds`, `alt`, `credit`, `licence`). `<Plate>` reads `MEDIA` and fails loudly on an unknown key; a video entry is written only when both encodes and the poster exist.

The Open Graph card is rendered at request time by `src/lib/og.tsx` through `src/app/opengraph-image.tsx` and `src/app/og/route.tsx` (docs/09 §5); there is no static card file or script.

### Adding or replacing an asset

1. Choose the file from `design/STOCK-SOURCES.md` (or the client's own material) and confirm its licence
2. Add or edit the entry in `design/media.manifest.json`: `key`, `url`, `page`, `credit`, `licence`, `licenceUrl`, `slot`, `aspect`, `focus` (optional), `ev: 0`, and a factual `alt` (what is in frame, no adjectives). For a clip: `trimStart`, `trimSeconds`, `loopSeconds`, `posterEv`, optional `crf` / `webmCrf`
3. Run the two scripts; read the output WebP; adjust `ev` until the frame sits low-to-mid with no crushed blacks and no washed highlights; re-run
4. Add the row to `design/ASSETS.md`; commit the binaries under `public/` with the manifest and `media.ts`

Commissioned photography replaces a stock frame by changing its `url` (a local `file://` path is not supported; place the file on any reachable https host or add it to the cache directory under `<key>.<ext>`, which the script picks up before fetching).

## Formats and sizes

| Asset         | Format                                                     | Budget                              |
| ------------- | ---------------------------------------------------------- | ----------------------------------- |
| Hero poster   | AVIF + WebP, 2400 wide                                     | ≤ 180kB                             |
| Hero video    | MP4 (H.264) + WebM (VP9), 1920×1080, 10–30s loop, no audio | **≤ 4MB** mp4, `preload="metadata"` |
| Plates (3:4)  | AVIF + WebP, 1040 wide                                     | ≤ 120kB each                        |
| Band (21:9)   | AVIF + WebP, 2100 wide                                     | ≤ 150kB                             |
| Team plates   | SVG silhouettes (generated)                                | ≤ 4kB each                          |
| Grain texture | inline SVG `feTurbulence`                                  | ≤ 2kB                               |

Initial-viewport media weight (poster + fonts) must stay under **1.6MB**. The video loads after the poster paints; the LCP is the poster, never the video. `next/image` re-encodes the WebP source per device width, so the on-disk plate size is the ceiling, not what ships; the served sizes are what the budget above is measured against (Task 20's Playwright audit, docs/09 §Measured budgets). Per-frame quality lives in `src/lib/plates.ts` (`plateQuality()`), with every value it uses listed in `images.qualities` in `next.config.ts`; today only `index-01`, the canopy silhouette, ships at 60 rather than 75, and it still exceeds 120 kB above 640 px served (see the ledger). Add a key there, with the measured reason beside it, rather than lowering the pipeline's global WebP quality.

**LQIP:** every `next/image` gets a `blurDataURL`. The blur-up is part of the art direction — images develop rather than pop in.

## Video specifics

- One continuous slow shot per clip; the loop point tested by extracting the first and last frames side by side and by stepping through the last 1.5 s
- `muted playsinline loop preload="metadata"` with a real poster; the poster is the LCP
- **Do not load at all** when `prefers-reduced-motion: reduce` or `navigator.connection.saveData`; show the poster
- The ambient gradient sits behind the video at 0.35 opacity on eligible desktops; the video is never transparent enough to depend on it
- The poster is a still through the full duotone; the video keeps some colour, so the first frame after autoplay shifts slightly. A fade-in on the `<video>` over the poster hides it.

## Fonts

Self-hosted via `next/font/google`. No external requests.

| Face        | Weights          | Subset           | Preload |
| ----------- | ---------------- | ---------------- | ------- |
| Bodoni Moda | 400 + 400 italic | latin, latin-ext | yes     |
| Jost        | variable         | latin, latin-ext | no      |

Typeface licensing is the client's (contract §3). The swap point is `src/app/layout.tsx`. Every display setting in the stylesheets is weight 400 (upright for titles, italic for the single emphasis voice), so the 500s were dropped in Task 20: two fewer preloaded files and eight fewer `@font-face` rules. Add a weight only with a rule that uses it.

## Audio

The client specifies a warm voice-over over the hero video (script in `pages/home.ts`). Until the recording exists, `pages/home.ts` has no `audioSrc` and the _Listen_ toggle does not render. When it arrives: `/public/audio/`, mono, ≤ 300kB, loaded **only** on first activation, fades in over 1.2s and out over 0.6s, default off, `aria-pressed` on the button. Never autoplays.

## Asset manifest

`design/ASSETS.md`, one row per file:

```
| File | Source page | Author | Licence | Stands in for | Aspect | Focus | ev |
```

Plus a _Rejected_ table with the reason, and a _Known gaps_ list (voice-over, portraits, commissioned photography). This is not bureaucracy: the moment the site is live, unlicensed assets are a legal problem, and by then no one remembers where anything came from.

## Placeholder discipline

Do not build templates against grey boxes. Real, graded stock from the first commit; swap for the client's material later. The layout is judged with photography in it.
