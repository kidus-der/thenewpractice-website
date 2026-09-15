# Asset Manifest

> **Every photograph and video clip in this repository is licence-free stock**, chosen to the art direction in `docs/02-art-direction.md` and graded into one look by `scripts/prepare-assets.mjs` and `scripts/prepare-video.mjs`. None of it was shot for the practice. Each file is replaceable by commissioned photography without a code change: replace the URL (or a local path) in `design/media.manifest.json`, re-run the two scripts, and the templates receive the new frame.
>
> The **ceiba mark and the palette are the client's own**, taken from the vector in `design/brand/The New Practice - Logo Concept.pdf`. Those are not stock.

Written by task 2b on 2026-09-14. The shortlist that chose these files, with the alternates per slot, is `design/STOCK-SOURCES.md`. Pipeline and grade: `docs/08-asset-pipeline.md`.

## The identity, extracted

| Asset | Source | Notes |
| --- | --- | --- |
| Ceiba mark geometry | `design/brand/The New Practice - Logo Concept.pdf`, page 2 | Six stroked paths and a filled point, lifted from the PDF's vector. Lives in `src/components/Mark.tsx`. |
| `public/icon.svg` | derived from the above | Favicon and app icon, on canopy ground |
| Palette | same PDF | `#14231C` canopy · `#F1ECE0` bone · `#A9895C` brass · `#E3DCCB` sand · `#C8B9A0` clay |

## Licence

All fifteen source files are from Pexels under the **Pexels License** (https://www.pexels.com/license/): free for commercial use, no attribution required, modification permitted. Attribution is recorded anyway as `Photo/Video by <author> on Pexels`. Constraints that apply to this set: no resale of unaltered copies, no use as part of a trademark, identifiable people must not be shown in a bad light. The one frame with a person (`band-discretion`) shows a back-turned silhouette; the one frame with a shadow of a person (`residence-06`) shows only the shadow.

## The grade

One treatment, applied identically to every still. Rationale in `docs/08-asset-pipeline.md` §The grade.

```
stills   crop to aspect (attention-based, or the manifest's focus)
         exposure   ×0.95 contrast, −22 global offset, plus the per-frame ev below
         saturation → 0
         map        grey → lerp(#182A21 canopy, #E9E2D3 bone)
         out        AVIF q55 + WebP q78 + 20 px WebP LQIP

video    scale/crop 1920×1080
         curves     blacks lifted to 6 %, highlights rolled off at 95 %
         eq         saturation 0.6, contrast 0.95
         colorbalance  shadows and mids cooled toward canopy
         hqdn3d     mild temporal denoise (bitrate, not look)
         loop       last 1 s crossfaded into the first 1 s
         out        H.264 CRF (see table) preset slow faststart, no audio
                    VP9 CRF 34 constant quality, no audio
```

## Video

| File | Source page | Author | Licence | Stands in for | Trim | CRF | Output |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `hero-surf` | https://www.pexels.com/video/serene-beach-waves-and-overcast-sky-35575712/ | Engin Akyurt | Pexels License | Hero loop (a): gentle surf, overcast | 19 s → 12 s loop | 30 | 1920×1080, 12.0 s, mp4 + webm |
| `hero-canopy` | https://www.pexels.com/video/lush-tropical-jungle-canopy-in-mist-35232259/ | Florian Delée | Pexels License | Hero loop (b): jungle canopy with mist | 2 s → 12 s loop | 29 | 1920×1080, 12.0 s, mp4 + webm |
| `hero-cenote` | https://www.pexels.com/video/the-cave-is-lit-up-by-the-light-of-the-moon-17145872/ | Florian Delée | Pexels License | Still water with light; reserved for Residences full-bleed | 0.5 s → 12 s loop | 24 | 1920×1080, 12.0 s, mp4 + webm |

The surf and canopy sources carry sensor noise that would not fit the 4 MB mp4 budget at the default CRF 24; they are encoded at CRF 30 and 29 after the same mild denoise. Actual sizes are in the ledger entry for task 2b.

## Stills

`ev` is the per-frame exposure trim in 0–255 units, set by reading each output against the art direction (low-to-mid contrast, lifted blacks, no washed-out frames). Positive lifts, negative deepens.

| File | Source page | Author | Licence | Stands in for | Aspect | Focus | ev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `hero-poster` | https://www.pexels.com/photo/body-of-water-under-gloomy-sky-9221275/ | Adrien Olichon | Pexels License | Hero poster, photographed alternative to the video frame | 16:9 | centre | −24 |
| `hero-surf-poster` | frame at 1 s of `hero-surf` | Engin Akyurt | Pexels License | Hero poster, the LCP behind the surf loop | 16:9 | attention | −8 |
| `hero-canopy-poster` | frame at 1 s of `hero-canopy` | Florian Delée | Pexels License | Poster behind the canopy loop | 16:9 | attention | 0 |
| `hero-cenote-poster` | frame at 1 s of `hero-cenote` | Florian Delée | Pexels License | Poster behind the cenote loop | 16:9 | attention | +16 |
| `residence-01` | https://www.pexels.com/photo/mysterious-dimly-lit-hallway-in-mexico-city-37408889/ | David Hernandez | Pexels License | Residence 01: corridor or doorway with light | 3:4 | centre | +30 |
| `residence-02` | https://www.pexels.com/photo/sun-shining-on-white-bedding-16596630/ | Lu Pir | Pexels License | Residence 02: linen bed, unoccupied | 3:4 | centre | +12 |
| `residence-03` | https://www.pexels.com/photo/abstract-natural-stone-surface-texture-36251225/ | Nati | Pexels License | Residence 03: limestone close-up | 3:4 | centre | −36 |
| `residence-04` | https://www.pexels.com/photo/lush-green-trees-above-fenced-terrace-in-summer-4917109/ | Maria Orlova | Pexels License | Residence 04: terrace to canopy | 3:4 | top | −6 |
| `residence-05` | https://www.pexels.com/photo/edge-of-a-pool-with-water-15383436/ | Gökhan Yetimova | Pexels License | Residence 05: still water | 3:4 | centre | +30 |
| `residence-06` | https://www.pexels.com/photo/shadow-on-stone-steps-surrounded-by-greenery-31325345/ | hello aesthe | Pexels License | Residence 06: shaded stone steps | 3:4 | centre | −6 |
| `index-01` | https://www.pexels.com/photo/canopy-of-trees-14222209/ | Lino Mohandas | Pexels License | Index 01: jungle canopy from below | 3:4 | centre | 0 |
| `index-02` | https://www.pexels.com/photo/seascape-on-a-gloomy-day-6665221/ | Josh Amparan | Pexels License | Index 02: sea | 3:4 | centre | −10 |
| `index-03` | https://www.pexels.com/photo/close-up-shot-of-a-limestone-9862523/ | cottonbro studio | Pexels License | Index 03: wet limestone | 3:4 | centre | +24 |
| `index-04` | https://www.pexels.com/photo/photograph-of-green-palm-leaves-with-water-droplets-7784532/ | Deeana Arts | Pexels License | Index 04: leaf with rain | 3:4 | centre | +18 |
| `band-discretion` | https://www.pexels.com/photo/silhouette-of-a-man-standing-by-the-window-in-a-room-16634008/ | Wavy. revolution | Pexels License | Discretion band: figure turned away | 21:9 | centre | +10 |

Licence URL for every row: https://www.pexels.com/license/. Every output is under `public/media/<key>.{avif,webp}` and `public/video/<key>.{mp4,webm}`; the typed manifest is `src/content/media.ts` (`MEDIA` for frames, `VIDEO` for loops).

## Rejected

Carried over from `design/STOCK-SOURCES.md` §Considered and rejected so no one re-evaluates them.

| Candidate | Why |
| --- | --- |
| Pexels video 36493035, 34654454, 13063616, 10512912, 35523387, 37431627, 37042868, 34571850, 36005732 | Portrait masters; the hero is 16:9. 36005732 also shows hammocks in limestone arches. |
| Pexels video 30514499 (cenote, Chichén Itzá) | Maya ruins visible; forbidden as backdrop. Sunny. |
| Pexels video 32640541, 12228649, 28613499 | Aerial or drone; 12228649 also reads temperate. |
| Pixabay video 234735 (Guadeloupe canopy) | Genuinely Caribbean, but an aerial overflight; kept only as a reserve. |
| Pixabay video 215170, 184840, 148042, 122802, 7265, 28231 | Postcard headland, drone, sun haze, temperate ferns, alpine pines, or under 10 s. |
| Mixkit 1934, 1925, 5016, 26300, 22728, 6806, 46147, 47722, 19496, 26323 | 720p maximum; the cave clips are orange-lit lava tubes. |
| Pexels photo 25913153, 4946762 | Hotel corridors with chandeliers, lanterns and rugs. |
| Pexels photo 2614738, 38452973 | Café furniture and people; white pavilion with statue. |
| Pexels photo 17294202, 38298178, 10884043, 19551940, 14781568 | Temperate or alpine vegetation, or an inhabited island. |
| Pexels photo 8251600, 12243565, 8673111, 8801681, 18132318, 9717311, 13538107 | Candle, plush toy, bare shoulders, hotel lamp, fluorescent room, autumn window, theatrical red dress. |
| Pexels photo 15277043, 9076557, 8682188, 37675827 | Dry rubble; storm drama; coconut palms that read holiday; monstera reads houseplant. |
| Coverr | No results for cenote; only an AI-generated clip for jungle mist. |
| Pexels video 36007491 (quietest surf) | 7.6 s, below the 10 s floor; would need a ping-pong edit. Not used. |

## Known gaps

- **Team portraits.** Eleven members; none photographed. Task 14 renders generated silhouette placeholders. No stock stands in for a person.
- **Real property photography.** The six residence plates are unrelated interiors and materials that the duotone makes read as one house. `residence-04` still shows a small table and stools at the bottom edge of the terrace; the top-weighted crop removes most but not all of it.
- **Voice-over.** `pages/home.ts` has no `audioSrc`; the *Listen* toggle does not render until the recording exists.
- **A photographed hero poster versus a video frame.** Both exist (`hero-poster` and `hero-surf-poster`). The video-frame poster is a still through the full duotone; the video that follows keeps some colour, so the first frame after autoplay will shift slightly. Task 16 decides which poster fronts the loop; see the open question in the ledger.
- **Moodboard.** `design/moodboard/` is empty.
