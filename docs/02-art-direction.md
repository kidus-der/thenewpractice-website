# 02 — Art Direction

## The idea in one sentence

**A place that is waiting for exactly one person.**

Every image, every frame of video, every crop, every held moment of silence in the layout serves that. The site is not populated. It is prepared.

## Mood

Think: a monograph on tropical modernism. Luis Barragán's light and Mexican modernism generally. Aman and Chablé's photography. Cereal magazine's crops. Late Kinfolk without the props. Sofia Coppola's stillness. The physical object closest to this website is a linen-bound book of architectural photography that someone left on a table and no one has opened yet.

**The place is the Riviera Maya**, not the Alps. Ocean and jungle: Caribbean surf at dawn, canopy with mist, cenote water, limestone, linen, shade. The client's own hero brief — _gentle ocean surf, jungle beginning to emerge, one or two distant tropical birds_ — is the mood in one line. Every frame should be plausible within an hour's drive of Puerto Aventuras. An alpine lake or a scree slope is a factual contradiction, not just a wrong mood.

**Not:** hotel booking site, medical brochure, meditation app, Squarespace wellness template, anything with a person mid-laugh.

## Media — what is real and what is stock

Until the client supplies photography, video, voice-over and portraits, **everything is licence-free stock** (Pexels, Pixabay, Mixkit, Coverr — free for commercial use without attribution; attribution recorded anyway) chosen to match the practice, plus **generated silhouette placeholders** for the eleven team members. Every file is logged with its source URL and licence in `design/ASSETS.md`; the shortlist that chose them is `design/STOCK-SOURCES.md`. See `docs/08-asset-pipeline.md`.

Stock is a stand-in, not a compromise: the templates are built to receive commissioned photography without a layout change.

## Imagery rules

### Subject matter — permitted

- **Architecture and interiors, unoccupied.** A corridor. A doorway with light across it. A single chair. A linen bed no one has slept in. Tropical-modern, not resort.
- **Landscape at distance.** Canopy, cloud, cenote and sea water, mist through trees, a shaded pool edge. Always wide, always quiet, never dramatic-golden-hour.
- **Materials in extreme close-up.** Raw linen weave. Limestone grain. Plaster. Water tension. Rain beaded on a leaf. Untreated hardwood.
- **The human presence, only obliquely.** A hand at the edge of frame. A shadow. A back turned. Never a face in focus. Never eye contact. Team portraits, when they arrive, are the one exception — and until then they are generated silhouettes.
- **Instruments of care, abstracted.** A glass of water. Never a syringe, chart, monitor, or anything that reads _hospital_.

### Subject matter — forbidden

Smiling models. Group therapy circles. Yoga poses. Massage tables. Hot stones. Lotus flowers. Candles. Bamboo. Anything from a "spa" stock search. Before/after anything. People in robes. Sunsets with lens flare. Drone shots that show off. Text baked into an image.

**Also forbidden, specific to this brief:** turquoise-water resort photography, white-sand beach clichés, hammocks, palapa-with-cocktail, Maya ruins as backdrop, resort branding, anything that reads _holiday_. The client is not on holiday. And no alpine, Nordic, or temperate-forest landscape — it contradicts the location outright.

### Treatment

| Property             | Direction                                                                                                                                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Palette in-image** | **Duotone.** Every still is mapped into the brand's two-colour range — a lifted canopy green in the shadows, bone in the highlights. No frame carries its own colour. Video is graded toward the same range in ffmpeg but keeps a little of its own colour so the surf reads as water. |
| **Contrast**         | Low-to-mid. Lifted blacks (never crushed). Highlights that roll off rather than clip.                                                                                                                                                                                                  |
| **Grain**            | Present but subtle — a fine film grain overlay at 3–5% opacity across the whole site, not per-image. See §Texture.                                                                                                                                                                     |
| **Exposure**         | Low and deep, not open and airy. Source frames get a per-frame trim before the duotone.                                                                                                                                                                                                |
| **Depth of field**   | Shallow on materials, deep on architecture. Never fake bokeh.                                                                                                                                                                                                                          |
| **Crop**             | Brave. Cut through the subject. Let a corridor run out of frame. Negative space is the point.                                                                                                                                                                                          |
| **Aspect ratios**    | Use only: `3:4` (portrait plates, team), `16:9` (hero, full-bleed), `1:1` (grid), `21:9` (band). Consistency here is what makes an amateur layout look art-directed.                                                                                                                   |

## Composition principles

**1. Asymmetry, always.** Nothing is centred except the hero lockup, the home statement and the final mark. Text blocks sit at column 2 of 12, or column 7 of 12 — never dead centre, never full width.

**2. One focal element per viewport.** If the user can see two things competing for attention at once, the section is not finished.

**3. Generous, uncomfortable whitespace.** Whatever spacing feels correct, increase it by one step on the scale. Ultra-luxury layouts are 60–70% empty. The most common failure mode in this build will be cramming — and it is most tempting on the long interior pages (Process has eleven sections) and the index pages (eleven services). Resist.

**4. The image is the hero, the type is the caption.** Except in the home statement and the manifesto, where that inverts completely and type becomes architectural. That inversion — image-led → type-led → image-led — is every template's visual rhythm.

**5. Hairlines, not borders.** Any rule on the page is `1px` at low alpha (`--rule`, `--rule-strong`). Dividing lines should be barely there. They exist to organise, not to decorate.

**6. Nothing has a shadow.** No `box-shadow` anywhere on this site. Elevation is communicated through overlap, scale, and colour value. This is the single fastest way to look expensive.

**7. Nothing has a rounded corner over 2px.** Sharp edges. The exception is form inputs, at `2px`, and nothing else.

## Texture

Three global overlays, in this order, applied above the page content:

| Layer                                                   | Spec                                                                                                                 | Purpose                                                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Grain**                                               | Tiled SVG feTurbulence noise, `opacity: 0.035`, `mix-blend-mode: overlay`, `pointer-events: none`, fixed to viewport | Kills the flat digital feel. Ties disparate photography together.                                               |
| **Vignette**                                            | Radial gradient, transparent centre → `rgb(20 35 28 / 0.18)` at corners, fixed                                       | Focuses attention; makes edges feel like a printed page                                                         |
| **Ambient gradient** _(home hero only, desktop, gated)_ | `@shadergradient/react` water-plane in canopy / canopy-soft / stone at 0.35 opacity behind the video, `grain="off"`  | Depth behind the surf without a second colour. Never brass. Removable in one file. See `docs/04` §8, `docs/07`. |

Grain must be a **static tiled texture, not animated**. Animated grain is a GPU cost with no aesthetic return at this opacity and it triggers motion sensitivity. The shader gradient's own grain stays off for the same reason — the site already has one.

## Ground rhythm

Every template alternates ground, and the alternation is the primary structural signal that a new idea has begun. Boundaries are **hard edges**, not crossfades — see `docs/04-motion-system.md` §5 before anyone tries otherwise.

```
Global
  Preloader / route curtain ── canopy
  Nav overlay               ── canopy
  Footer                    ── canopy

T1 Home
  Hero (video)              ── canopy
  §1 statement + triad      ── bone
  §2 long-read              ── bone
  §3 who we help            ── sand
  §4 philosophy + manifesto ── canopy
  §5 begin the conversation ── bone

T2 Interior     bone throughout; inline plates on sand bands; enquire band canopy
T3 Treatment    bone; lists ("we provide treatment for", "may include") and related services sand, never two sand blocks in a row; definitions bone; enquire band canopy
T4 Profile      bone; portrait plate frame sand
T5 Residences   bone; plate carousel sand; amenities table bone; privacy statement canopy
T6 Index        bone throughout — the list is the composition
T7 Enquiry      split: canopy (letter + founder contact) / bone (form)
```

Each template's file lists its own sequence in `docs/05`.

## Cursor

A custom cursor is permitted and encouraged, but at the quietest possible setting:

- Default: a `7px` filled circle in `--ground-fg`, at `0.55` alpha
- Over interactive elements: scales to `36px`, alpha drops to `0.28`
- Trails with a lerp of `0.28` — weighted, but never _behind_ the pointer
- **Hidden entirely on touch devices and when `prefers-reduced-motion` is set** — with the native cursor restored

Three lessons from the concept site, kept:

- **No `mix-blend-mode`.** Difference blending on a viewport-fixed element makes the compositor re-read the backdrop every frame. `--ground-fg` is already legible on either ground.
- **Lerp at `0.28`, not lower.** Below that the dot reads as _trailing_ rather than _weighted_, and on the 120Hz displays this audience uses it reads as broken.
- **No label states** except where a plate hover preview on an index page wants one. No `DRAG`.

Do not build a cursor that follows with physics, blurs, distorts, or magnetises to buttons.

## Anti-patterns — reject these on sight

| Pattern                                                                 | Why it fails here                                                                                                                                               |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Glassmorphism / frosted panels                                          | Consumer OS vocabulary, not luxury print. (The settled header's `backdrop-filter` is the one tolerated use, and Safari may cost it.)                            |
| Gradient meshes, aurora blobs                                           | Reads as SaaS startup. The ambient gradient is a near-monochrome water plane at 0.35, not this.                                                                 |
| Neon or high-saturation accents                                         | Cheapens instantly                                                                                                                                              |
| Marquee text scrolling infinitely                                       | Permitted **once** on the site: the footer wordmark, at low contrast, static under reduced motion                                                               |
| Big rounded pill buttons                                                | Consumer app                                                                                                                                                    |
| Icon sets (Lucide, Feather, etc.)                                       | Iconography is a systems-design language; luxury editorial uses type and rules. **No icons on this site** except the audio toggle bars and the scroll cue rule. |
| Card grids with shadows and hover-lift                                  | The single most template-looking pattern on the web                                                                                                             |
| Accordions, tabs, carousels-with-dots                                   | The treatment page renders its definitions open; the residences carousel drifts and has no controls                                                             |
| "Trusted by" logo strips, counting-up statistics, testimonial carousels | Wrong for a practice that treats one person and publishes no outcomes                                                                                           |
| A map on the residences page                                            | Privacy-first: no map, no address                                                                                                                               |
