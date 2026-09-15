# Stock media sources — shortlist for Task 2b

Research date: 2026-09-14. Governing brief: `docs/BUILD-LEDGER.md` (Task 2a) and `docs/02-art-direction.md` (permitted and forbidden subject matter, treatment, aspect ratios). Nothing here has been downloaded; only the URLs were verified.

## How this was verified

- Every **direct download URL** below returned `HTTP 200` with `video/mp4` or `image/jpeg` to a `curl -sI` HEAD request on 2026-09-14.
- **Video duration and frame size** were read from the MP4 container headers (`moov`, and fragment headers for fragmented files) over HTTP range requests, without downloading the media. Values are accurate to about 0.1 s.
- **Photo dimensions** are the original pixel size Pexels advertises for the file (width from the page's original-size download parameter, height from the frame's aspect ratio).
- **Thumbnails of every candidate were viewed** and judged against the art direction before inclusion. Candidates rejected on sight are listed at the end so no one re-evaluates them.
- Pexels and Pixabay serve `403` to plain curl on their HTML pages, so page metadata was read through a browser-rendered fetch. Their CDNs (`videos.pexels.com`, `images.pexels.com`, `cdn.pixabay.com`) answer curl normally, which is what Task 2b's script needs.

## Licences

| Source | Licence | URL | Commercial use | Attribution | Notes |
|---|---|---|---|---|---|
| Pexels | Pexels License | https://www.pexels.com/license/ | Yes | Not required (recorded anyway) | Do not sell unaltered copies; do not use imagery as part of a trademark or business name; identifiable people must not be shown in a bad light. All picks are unoccupied or show a back-turned, unidentifiable figure. |
| Pixabay | Pixabay Content License | https://pixabay.com/service/license-summary/ | Yes | Not required (recorded anyway) | No standalone redistribution; no use in a trademark. Only one Pixabay clip is listed, as a reserve. |
| Mixkit | Mixkit Stock Video Free License | https://mixkit.co/license/ | Yes | Not required | Nothing selected: every relevant Mixkit clip found tops out at 720p (`assets.mixkit.co/videos/<id>/<id>-720.mp4`; the 1080 and 4K paths return 403/404). |
| Coverr | Coverr License | https://coverr.co/license | Yes | Not required | Nothing selected: the search returned zero clips for "cenote" and only an AI-generated "droid explorer" clip for "jungle mist". No API key needed; simply nothing usable. |

Attribution string to keep in `design/ASSETS.md`: `Photo/Video by <author> on Pexels` (or `on Pixabay`).

---

## Video

Requirements: 16:9, at least 1080p, 10 to 30 s, loopable, no people, muted in use. The hero uses only the surf and canopy clips; the cenote clip is reserved for the Residences full-bleed or a later use.

### (a) Gentle Caribbean surf from the shore, overcast

**1. Serene beach waves and overcast sky** — RECOMMENDED
- Page: https://www.pexels.com/video/serene-beach-waves-and-overcast-sky-35575712/
- Direct: https://videos.pexels.com/video-files/35575712/15076554_2560_1440_30fps.mp4
- 2560×1440, 30 fps, 32.97 s, 66.0 MB. Author: Engin Akyurt. Licence: Pexels License, https://www.pexels.com/license/
- Why: flat grey sky, foam sliding over a pebble shore, no horizon drama and no people; the sea's slight teal will vanish in the duotone. Over 30 s in source, so Task 2b trims a 12 s segment from a calm passage (start around 4 s).

**2. Tranquil overcast beach scene with gentle waves**
- Page: https://www.pexels.com/video/tranquil-overcast-beach-scene-with-gentle-waves-36007491/
- Direct: https://videos.pexels.com/video-files/36007491/15268995_1920_1080_30fps.mp4
- 1920×1080, 30 fps, 7.6 s, 7.1 MB. Author: Zmaysq. Licence: Pexels License.
- Why: the quietest frame of the set: wet grey sand, a single low line of surf, milky sky. Caveat: only 7.6 s, below the 10 s floor, so it would loop noticeably or need a ping-pong edit. Listed because it is visually the closest to the brief.

**3. Serene ocean waves on sandy beach**
- Page: https://www.pexels.com/video/serene-ocean-waves-on-sandy-beach-36208868/
- Direct: https://videos.pexels.com/video-files/36208868/15354760_2560_1440_60fps.mp4
- 2560×1440, 60 fps, 33.72 s, 110.3 MB. Author: Yunus Terk. Licence: Pexels License.
- Why: overcast, grey-green sea, brown sand. Busier surf than the pick and there are footprints in the foreground sand; usable if a wider, more open shore is wanted.

### (b) Dense jungle canopy with slow movement or mist

**1. Lush tropical jungle canopy in mist** — RECOMMENDED
- Page: https://www.pexels.com/video/lush-tropical-jungle-canopy-in-mist-35232259/
- Direct: https://videos.pexels.com/video-files/35232259/14926814_2560_1440_30fps.mp4
- 2560×1440, 30 fps, 18.25 s, 39.3 MB. Author: Florian Delée. Licence: Pexels License.
- Why: broad wet heliconia-type leaves in the foreground, dense misty understory behind, no sky, no people. The broadleaf register is the most Yucatán-plausible of the canopy clips.

**2. Fog, tropic jungle, Latin America (I)**
- Page: https://www.pexels.com/video/fog-tropic-jungle-latin-america-19366762/
- Direct: https://videos.pexels.com/video-files/19366762/uhd_30fps.mp4
- 2560×1440, 30 fps, 13.14 s, 19.0 MB. Author: Florian Delée. Licence: Pexels License.
- Why: canopy seen from below through fog, moss-hung branches, near-monochrome already. Reads as cloud forest rather than lowland jungle, which is the only reason it is second.

**3. Fog, tropic jungle, Latin America (II)**
- Page: https://www.pexels.com/video/fog-tropic-jungle-latin-america-19366764/
- Direct: https://videos.pexels.com/video-files/19366764/uhd_30fps.mp4
- 2560×1440, 30 fps, 13.74 s, 19.1 MB. Author: Florian Delée. Licence: Pexels License.
- Why: sibling of the clip above with more trunks and epiphytes; same caveat.

Reserve (drone, listed for completeness only): **Jungle, forest, Caribbean (Guadeloupe)**, https://pixabay.com/videos/jungle-forest-caribbean-guadeloupe-234735/ , direct https://cdn.pixabay.com/video/2024/10/04/234735_large.mp4 , 3840×2160, 24.89 s, 134.5 MB, Pixabay Content License. Genuinely Caribbean broadleaf canopy with mist pockets, but it is an aerial overflight and the brief rejects drone shots; use only if the owner wants a slow aerial and accepts the caveat.

### (c) Cenote or still dark water with light

**1. The cave is lit up by the light (Mexican cave, water)** — RECOMMENDED
- Page: https://www.pexels.com/video/the-cave-is-lit-up-by-the-light-of-the-moon-17145872/
- Direct: https://videos.pexels.com/video-files/17145872/17145872-uhd_2560_1440_30fps.mp4
- 2560×1440, 30 fps, 14.51 s, 14.8 MB. Author: Florian Delée. Licence: Pexels License.
- Why: dark still water inside a limestone cave, stalactites and their reflections picked out by a single light source; no people, no turquoise. The closest match to "still dark water with light shafts".

**2. Emerald cenote below a limestone overhang**
- Page: https://www.pexels.com/video/the-green-water-is-surrounded-by-trees-and-green-vegetation-17382716/
- Direct: https://videos.pexels.com/video-files/17382716/17382716-uhd_2560_1440_24fps.mp4
- 2560×1440, 24 fps, 15.23 s, 26.8 MB. Author: Andres Daza. Licence: Pexels License.
- Why: open cenote with a pale limestone lip, hanging roots and ferns; exactly the geology of the coast. Brighter and greener than the brief wants, so it depends on the duotone and a deep exposure trim. 24 fps.

**3. Stalactites in a Mexican cave**
- Page: https://www.pexels.com/video/the-cave-is-lit-up-by-the-light-of-the-moon-17145874/
- Direct: https://videos.pexels.com/video-files/17145874/17145874-uhd_2560_1440_30fps.mp4
- 2560×1440, 30 fps, 11.84 s, 19.5 MB. Author: Florian Delée. Licence: Pexels License.
- Why: same cave, limestone texture only, no water visible. A texture plate rather than a water plate.

---

## Hero poster still (16:9, surf or canopy, low and deep, not golden hour)

Task 2b will also extract a poster frame from the chosen clip; these are the still-photo alternatives if a photographed poster reads better than a video frame.

**1. Body of water under gloomy sky** — RECOMMENDED
- Page: https://www.pexels.com/photo/body-of-water-under-gloomy-sky-9221275/
- Direct: https://images.pexels.com/photos/9221275/pexels-photo-9221275.jpeg
- 6123×4085 (3:2; crop to 16:9). Author: Adrien Olichon. Licence: Pexels License.
- Why: flat overcast light, a low line of surf, empty shingle in the foreground, horizon dead level. Nothing competes.

**2. Black and white photo of beach under cloudy sky**
- Page: https://www.pexels.com/photo/black-and-white-photo-of-beach-under-cloudy-sky-6189893/
- Direct: https://images.pexels.com/photos/6189893/pexels-photo-6189893.jpeg
- 6413×3894 (1.65:1; crop to 16:9). Author: Engin Akyurt. Licence: Pexels License.
- Why: long exposure smooths the surf to mist under a heavy sky; already tonal, so the duotone maps cleanly. Slightly more dramatic sky than the pick.

**3. Waves on the ocean during a cloudy day**
- Page: https://www.pexels.com/photo/waves-on-the-ocean-during-a-cloudy-day-11240200/
- Direct: https://images.pexels.com/photos/11240200/pexels-photo-11240200.jpeg
- 6123×4085 (3:2; crop to 16:9). Author: David McElwee. Licence: Pexels License.
- Why: sea fog rolling over lines of surf, deep blue-grey; needs a stronger exposure trim than the others.

---

## Residence plates (3:4 portrait, unoccupied, tropical-modern or limestone/plaster, no branding)

### R1. Corridor or doorway with light across it

**1. Dimly lit hallway, Mexico City** — RECOMMENDED
- Page: https://www.pexels.com/photo/mysterious-dimly-lit-hallway-in-mexico-city-37408889/
- Direct: https://images.pexels.com/photos/37408889/pexels-photo-37408889.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: David Hernandez. Licence: Pexels License.
- Why: an open louvred door, a bar of light across a wooden floor into an empty room, everything else in shadow. Barragán register, Mexican interior, no one there.

**2. Empty hallway between concrete walls**
- Page: https://www.pexels.com/photo/an-empty-hallway-between-concrete-walls-11105518/
- Direct: https://images.pexels.com/photos/11105518/pexels-photo-11105518.jpeg
- 3751×6666 (9:16; crop to 3:4). Author: YEŞ. Licence: Pexels License.
- Why: arched plaster corridor with light falling through side openings onto the floor. Slightly derelict texture, which the duotone will read as patina.

**3. Minimalist interior design (white door with shadow)**
- Page: https://www.pexels.com/photo/minimalist-interior-design-15486357/
- Direct: https://images.pexels.com/photos/15486357/pexels-photo-15486357.jpeg
- 3750×6664 (9:16; crop to 3:4). Author: David Underland. Licence: Pexels License.
- Why: a single flush door with a soft diagonal shadow; the quietest option, but reads Northern European rather than tropical.

### R2. A made linen bed no one has slept in

Caveat: free stock has almost no crisply made beds without hotel styling; all three are lightly rumpled linen. The pick is saved by its light.

**1. Sun shining on white bedding** — RECOMMENDED
- Page: https://www.pexels.com/photo/sun-shining-on-white-bedding-16596630/
- Direct: https://images.pexels.com/photos/16596630/pexels-photo-16596630.jpeg
- 4132×6050 (approx 2:3; crop to 3:4). Author: Lu Pir. Licence: Pexels License.
- Why: a hard shaft of window light across white linen against a dark wall, low key, no props. Exactly "low and deep, not open and airy".

**2. Linen on bed**
- Page: https://www.pexels.com/photo/linen-on-bed-3847546/
- Direct: https://images.pexels.com/photos/3847546/pexels-photo-3847546.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: ready made. Licence: Pexels License.
- Why: stone-grey washed linen, bare wall, wooden floor; most "linen weave" of the three but bright and softly unmade.

**3. A bed with white pillow and creased linen**
- Page: https://www.pexels.com/photo/a-bed-with-white-pillow-and-creased-linen-10061393/
- Direct: https://images.pexels.com/photos/10061393/pexels-photo-10061393.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: cottonbro studio. Licence: Pexels License.
- Why: cool light and shadow on white cotton; more crumpled than the brief wants.

### R3. Limestone or lime-plaster close-up

**1. Abstract natural stone surface texture** — RECOMMENDED
- Page: https://www.pexels.com/photo/abstract-natural-stone-surface-texture-36251225/
- Direct: https://images.pexels.com/photos/36251225/pexels-photo-36251225.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: Nati. Licence: Pexels License.
- Why: pitted beige travertine-type limestone, the stone of the Yucatán coast; flat, even light, pure material.

**2. Plastered white walls**
- Page: https://www.pexels.com/photo/plastered-white-walls-14816070/
- Direct: https://images.pexels.com/photos/14816070/pexels-photo-14816070.jpeg
- 4329×5770 (3:4 native). Author: Studio Pépite. Licence: Pexels License.
- Why: rough lime plaster at a corner with leaf shadows moving across it; already 3:4. The plaster alternative to the stone pick.

**3. Rough stone surface**
- Page: https://www.pexels.com/photo/rough-stone-surface-17204381/
- Direct: https://images.pexels.com/photos/17204381/pexels-photo-17204381.jpeg
- 4330×5771 (3:4 native). Author: Krakograff Textures. Licence: Pexels License.
- Why: warm mottled limestone with hairline veins; a little busier than the pick.

### R4. Terrace or opening onto canopy

**1. Lush green trees above fenced terrace** — RECOMMENDED
- Page: https://www.pexels.com/photo/lush-green-trees-above-fenced-terrace-in-summer-4917109/
- Direct: https://images.pexels.com/photos/4917109/pexels-photo-4917109.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: Maria Orlova. Licence: Pexels License.
- Why: a small terrace edge and railing at the bottom of the frame, a wall of dense jungle canopy filling everything above; the terrace is a footnote to the trees. Crop away the small table if it reads as furniture.

**2. Trees behind windows (concrete opening)**
- Page: https://www.pexels.com/photo/trees-behind-windows-20166746/
- Direct: https://images.pexels.com/photos/20166746/pexels-photo-20166746.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: Daniel Andraski. Licence: Pexels License.
- Why: board-formed concrete pier and a tall glazed slot onto greenery; tropical modernism verbatim. Contains a potted cactus and light switches; crop right of the pier.

**3. Trees behind sunlit house (Bali balcony)**
- Page: https://www.pexels.com/photo/trees-behind-sunlit-house-16053956/
- Direct: https://images.pexels.com/photos/16053956/pexels-photo-16053956.jpeg
- 4330×5771 (3:4 native). Author: Marichka Dmytrieva. Licence: Pexels License.
- Why: plaster balcony parapet opening onto palms and canopy; brighter and sunnier than the brief, needs the strongest exposure trim.

### R5. Still water at a pool edge or cenote

**1. Edge of a pool with water (dark reflective pool)** — RECOMMENDED
- Page: https://www.pexels.com/photo/edge-of-a-pool-with-water-15383436/
- Direct: https://images.pexels.com/photos/15383436/pexels-photo-15383436.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: Gökhan Yetimova. Licence: Pexels License.
- Why: a curved stone coping meeting black still water with tree reflections; reads as a cenote lip or a stone pool, already dark and deep.

**2. The corner of a pool**
- Page: https://www.pexels.com/photo/the-corner-of-a-pool-12181683/
- Direct: https://images.pexels.com/photos/12181683/pexels-photo-12181683.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: Blue Arauz. Licence: Pexels License.
- Why: a concrete corner cutting into rippled water, strong geometry; the water is blue in source but the duotone removes that.

**3. Reflective water pool with palm-tree silhouettes**
- Page: https://www.pexels.com/photo/reflective-water-pool-with-palm-tree-silhouettes-38575072/
- Direct: https://images.pexels.com/photos/38575072/pexels-photo-38575072.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: Felipe. Licence: Pexels License.
- Why: leaf shadows on a still tiled pool; the tiles read "swimming pool" more than the brief wants.

### R6. Shaded stone steps

**1. Shadow on stone steps surrounded by greenery** — RECOMMENDED
- Page: https://www.pexels.com/photo/shadow-on-stone-steps-surrounded-by-greenery-31325345/
- Direct: https://images.pexels.com/photos/31325345/pexels-photo-31325345.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: hello aesthe. Licence: Pexels License.
- Why: worn pale stone steps, leaf shadows, and the shadow of a figure at the edge (the permitted oblique presence). Mossy limestone register.

**2. Shadow on sunlit stairs**
- Page: https://www.pexels.com/photo/shadow-on-sunlit-stairs-18431233/
- Direct: https://images.pexels.com/photos/18431233/pexels-photo-18431233.jpeg
- 4119×6067 (approx 2:3; crop to 3:4). Author: Javid Hashimov. Licence: Pexels License.
- Why: pale sandstone steps with one hard diagonal shadow; clean, architectural, no greenery.

**3. Subtle shadow play on weathered stone steps**
- Page: https://www.pexels.com/photo/subtle-shadow-play-on-weathered-stone-steps-31325341/
- Direct: https://images.pexels.com/photos/31325341/pexels-photo-31325341.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: hello aesthe. Licence: Pexels License.
- Why: same staircase as the pick, tighter crop, the figure's shadow more central.

---

## Index plates (3:4)

### I1. Jungle canopy from below

**1. Canopy of trees (Palakkad)** — RECOMMENDED
- Page: https://www.pexels.com/photo/canopy-of-trees-14222209/
- Direct: https://images.pexels.com/photos/14222209/pexels-photo-14222209.jpeg
- 4330×5771 (3:4 native). Author: Lino Mohandas. Licence: Pexels License.
- Why: dense tropical broadleaf canopy silhouetted against a white sky, straight up, no sun.

**2. Lush green tree canopy captured from below**
- Page: https://www.pexels.com/photo/lush-green-tree-canopy-captured-from-below-29126058/
- Direct: https://images.pexels.com/photos/29126058/pexels-photo-29126058.jpeg
- 4330×5771 (3:4 native). Author: Berlyn Cordero. Licence: Pexels License.
- Why: tropical hardwood canopy from below under a pale sky; lighter and more open than the pick.

**3. Green trees in the forest under white sky (misty canopy)**
- Page: https://www.pexels.com/photo/green-trees-in-the-forest-under-white-sky-10387184/
- Direct: https://images.pexels.com/photos/10387184/pexels-photo-10387184.jpeg
- 4322×5785 (3:4 native). Author: Alfin Auzikri. Licence: Pexels License.
- Why: jungle canopy in mist seen across a valley rather than from below; the best "mist through trees" still in the set and a strong alternate for any canopy slot.

### I2. Sea horizon

**1. Seascape on a gloomy day** — RECOMMENDED
- Page: https://www.pexels.com/photo/seascape-on-a-gloomy-day-6665221/
- Direct: https://images.pexels.com/photos/6665221/pexels-photo-6665221.jpeg
- 4472×5590 (4:5; crop to 3:4). Author: Josh Amparan. Licence: Pexels License.
- Why: a single unbroken swell under a flat grey sky, horizon a third from the top; nothing else in frame.

**2. A calm ocean under a gloomy sky**
- Page: https://www.pexels.com/photo/a-calm-ocean-under-a-gloomy-sky-4695758/
- Direct: https://images.pexels.com/photos/4695758/pexels-photo-4695758.jpeg
- 4330×5771 (3:4 native). Author: Polina Chistyakova. Licence: Pexels License.
- Why: heavier, rain-bearing sky over grey-green water; moodier than the pick.

**3. Fog over sea**
- Page: https://www.pexels.com/photo/fog-over-sea-14992885/
- Direct: https://images.pexels.com/photos/14992885/pexels-photo-14992885.jpeg
- 4305×5806 (approx 3:4). Author: Chandan Suman. Licence: Pexels License.
- Why: water dissolving into white fog, almost empty; a tiny boat on the horizon would need cropping.

### I3. Wet limestone

**1. Close-up shot of a limestone** — RECOMMENDED
- Page: https://www.pexels.com/photo/close-up-shot-of-a-limestone-9862523/
- Direct: https://images.pexels.com/photos/9862523/pexels-photo-9862523.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: cottonbro studio. Licence: Pexels License.
- Why: dark, damp, fissured limestone with a soft raking light; the deepest material plate in the set.

**2. Dark surface of a large stone**
- Page: https://www.pexels.com/photo/dark-surface-of-a-large-stone-18510626/
- Direct: https://images.pexels.com/photos/18510626/pexels-photo-18510626.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: Adrien Olichon. Licence: Pexels License.
- Why: wet rock face with water streaks and a cold light; not certainly limestone, but reads as wet stone in a cenote.

**3. Detailed view of cracked limestone surface**
- Page: https://www.pexels.com/photo/detailed-view-of-cracked-limestone-surface-36309861/
- Direct: https://images.pexels.com/photos/36309861/pexels-photo-36309861.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: Aibek Skakov. Licence: Pexels License.
- Why: pale cracked limestone, dry; the lightest of the three and the one to use if the index needs a bone-toned plate.

### I4. Rain beaded on a broad leaf

**1. Green palm leaves with water droplets** — RECOMMENDED
- Page: https://www.pexels.com/photo/photograph-of-green-palm-leaves-with-water-droplets-7784532/
- Direct: https://images.pexels.com/photos/7784532/pexels-photo-7784532.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: Deeana Arts. Licence: Pexels License.
- Why: dark teal palm fronds beaded with rain, already low key; broad tropical leaf without the houseplant reading.

**2. Green leaves on a rainy day**
- Page: https://www.pexels.com/photo/green-leaves-on-a-rainy-a-day-13203900/
- Direct: https://images.pexels.com/photos/13203900/pexels-photo-13203900.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: Soubhagya Maharana. Licence: Pexels License.
- Why: rain actually falling through dark foliage, streaks visible; the most "weather" of the set and a strong alternate for the hero mood.

**3. Close-up of dew on vibrant green banana leaf**
- Page: https://www.pexels.com/photo/close-up-of-dew-on-vibrant-green-banana-leaf-32814910/
- Direct: https://images.pexels.com/photos/32814910/pexels-photo-32814910.jpeg
- 4082×6123 (2:3; crop to 3:4). Author: Nothing Ahead. Licence: Pexels License.
- Why: banana-leaf ribs with beaded water, graphic and broad; saturated green in source, fully tamed by the duotone.

---

## Discretion band (21:9, cropped from a wide frame)

**1. Silhouette of a man standing by the window in a room** — RECOMMENDED
- Page: https://www.pexels.com/photo/silhouette-of-a-man-standing-by-the-window-in-a-room-16634008/
- Direct: https://images.pexels.com/photos/16634008/pexels-photo-16634008.jpeg
- 5594×4467 (5:4). A 21:9 crop through the window band yields about 5594×2397. Author: Wavy. revolution. Licence: Pexels License.
- Why: a figure seen only from behind, head lowered, against a window with a palm's shadow on the blind; no face, no eye contact, a tropical hint. The definition of "a back turned".

**2. Shadow of a window frame on the wood flooring of an empty room**
- Page: https://www.pexels.com/photo/shadow-of-a-window-frame-on-the-wood-flooring-of-an-empty-room-18707513/
- Direct: https://images.pexels.com/photos/18707513/pexels-photo-18707513.jpeg
- 6885×3629 (1.9:1). A 21:9 crop yields about 6885×2951. Author: sanket mahind. Licence: Pexels License.
- Why: the "empty shaded room" option: bare plaster wall, one parallelogram of window light on a timber floor, nothing else.

**3. Doorway in corner with white walls**
- Page: https://www.pexels.com/photo/doorway-in-corner-with-white-walls-21529965/
- Direct: https://images.pexels.com/photos/21529965/pexels-photo-21529965.jpeg
- 6123×4085 (3:2). A 21:9 crop yields about 6123×2624. Author: Alisa Velieva. Licence: Pexels License.
- Why: a white room and a single dark doorway; the most abstract of the three, but it can read as a gallery rather than a residence.

---

## Considered and rejected (do not re-evaluate)

| Item | Reason |
|---|---|
| Pexels video 36493035, 34654454, 13063616, 10512912, 35523387, 37431627, 37042868, 34571850, 36005732 | Portrait 9:16 masters; the hero is 16:9. 36005732 also shows hammocks in limestone arches. |
| Pexels video 30514499 (cenote, Chichén Itzá) | Maya ruins visible on the right; forbidden as backdrop. Sunny. |
| Pexels video 32640541, 12228649, 28613499 | Aerial or drone; 12228649 also reads temperate. |
| Pixabay video 215170, 184840, 148042, 122802, 7265, 28231 | Blue-sky postcard headland, drone, sun haze, temperate ferns, silhouetted pines (alpine), or under 10 s. |
| Mixkit 1934, 1925, 5016, 26300, 22728, 6806, 46147, 47722, 19496, 26323 | 720p maximum; the two cave clips are also orange-lit lava tubes. |
| Pexels photo 25913153, 4946762 | Hotel corridors with chandeliers or lanterns and rugs. |
| Pexels photo 2614738, 38452973 | Café furniture and people; white pavilion with statue. |
| Pexels photo 17294202, 38298178, 10884043, 19551940, 14781568 | Temperate or alpine vegetation (autumn trees, Finnish conifers, oak, coastal pines), or an inhabited island. |
| Pexels photo 8251600, 12243565, 8673111, 8801681, 18132318, 9717311, 13538107 | Candle in shot; plush toy; bare shoulders in a hotel room; hotel lamp; fluorescent institutional room; warm autumn window; theatrical red dress (kept out of the picks, noted only). |
| Pexels photo 15277043, 9076557, 8682188, 37675827 | Dry rubble; storm drama; coconut palms with a vignette that reads holiday; monstera reads houseplant (native, but the association is wrong). |
| Coverr | No results for cenote; only an AI-generated clip for jungle mist. |

---

## Recommended set

| Slot | Pick | Source / author | Direct URL |
|---|---|---|---|
| Video, surf | Serene beach waves and overcast sky (2560×1440, 32.97 s, trim 12 s) | Pexels / Engin Akyurt | https://videos.pexels.com/video-files/35575712/15076554_2560_1440_30fps.mp4 |
| Video, canopy | Lush tropical jungle canopy in mist (2560×1440, 18.25 s, trim 12 s) | Pexels / Florian Delée | https://videos.pexels.com/video-files/35232259/14926814_2560_1440_30fps.mp4 |
| Video, cenote | Mexican cave, still water and light (2560×1440, 14.51 s, trim 12 s) | Pexels / Florian Delée | https://videos.pexels.com/video-files/17145872/17145872-uhd_2560_1440_30fps.mp4 |
| Hero poster 16:9 | Body of water under gloomy sky (6123×4085) | Pexels / Adrien Olichon | https://images.pexels.com/photos/9221275/pexels-photo-9221275.jpeg |
| Residence 01, corridor | Dimly lit hallway, Mexico City (4082×6123) | Pexels / David Hernandez | https://images.pexels.com/photos/37408889/pexels-photo-37408889.jpeg |
| Residence 02, linen bed | Sun shining on white bedding (4132×6050) | Pexels / Lu Pir | https://images.pexels.com/photos/16596630/pexels-photo-16596630.jpeg |
| Residence 03, limestone | Abstract natural stone surface texture (4082×6123) | Pexels / Nati | https://images.pexels.com/photos/36251225/pexels-photo-36251225.jpeg |
| Residence 04, terrace to canopy | Lush green trees above fenced terrace (4082×6123) | Pexels / Maria Orlova | https://images.pexels.com/photos/4917109/pexels-photo-4917109.jpeg |
| Residence 05, still water | Edge of a pool with water (4082×6123) | Pexels / Gökhan Yetimova | https://images.pexels.com/photos/15383436/pexels-photo-15383436.jpeg |
| Residence 06, stone steps | Shadow on stone steps surrounded by greenery (4082×6123) | Pexels / hello aesthe | https://images.pexels.com/photos/31325345/pexels-photo-31325345.jpeg |
| Index 01, canopy below | Canopy of trees, Palakkad (4330×5771) | Pexels / Lino Mohandas | https://images.pexels.com/photos/14222209/pexels-photo-14222209.jpeg |
| Index 02, sea horizon | Seascape on a gloomy day (4472×5590) | Pexels / Josh Amparan | https://images.pexels.com/photos/6665221/pexels-photo-6665221.jpeg |
| Index 03, wet limestone | Close-up shot of a limestone (4082×6123) | Pexels / cottonbro studio | https://images.pexels.com/photos/9862523/pexels-photo-9862523.jpeg |
| Index 04, rain on leaf | Green palm leaves with water droplets (4082×6123) | Pexels / Deeana Arts | https://images.pexels.com/photos/7784532/pexels-photo-7784532.jpeg |
| Discretion band 21:9 | Silhouette of a man by the window (5594×4467, crop) | Pexels / Wavy. revolution | https://images.pexels.com/photos/16634008/pexels-photo-16634008.jpeg |

All fifteen files are Pexels License (https://www.pexels.com/license/), free for commercial use, attribution not required but recorded above.

### Proposed `design/media.manifest.json`

Shape agreed with Task 2b: `video[]` entries carry `key`, `url`, `trimStart` and `trimSeconds` (seconds); `stills[]` entries carry `key`, `url`, `aspect` and `ev` (exposure trim in 0–255 units, left at 0 for 2b to set per frame). Aspects are the target crop, not the source aspect. `trimStart` values are suggestions from the thumbnails only; 2b should check the loop point at half speed.

```json
{
  "video": [
    { "key": "hero-surf",   "url": "https://videos.pexels.com/video-files/35575712/15076554_2560_1440_30fps.mp4", "trimStart": 4, "trimSeconds": 12 },
    { "key": "hero-canopy", "url": "https://videos.pexels.com/video-files/35232259/14926814_2560_1440_30fps.mp4", "trimStart": 2, "trimSeconds": 12 },
    { "key": "cenote",      "url": "https://videos.pexels.com/video-files/17145872/17145872-uhd_2560_1440_30fps.mp4", "trimStart": 1, "trimSeconds": 12 }
  ],
  "stills": [
    { "key": "hero-poster",     "url": "https://images.pexels.com/photos/9221275/pexels-photo-9221275.jpeg",   "aspect": "16:9", "ev": 0 },
    { "key": "residence-01",    "url": "https://images.pexels.com/photos/37408889/pexels-photo-37408889.jpeg", "aspect": "3:4",  "ev": 0 },
    { "key": "residence-02",    "url": "https://images.pexels.com/photos/16596630/pexels-photo-16596630.jpeg", "aspect": "3:4",  "ev": 0 },
    { "key": "residence-03",    "url": "https://images.pexels.com/photos/36251225/pexels-photo-36251225.jpeg", "aspect": "3:4",  "ev": 0 },
    { "key": "residence-04",    "url": "https://images.pexels.com/photos/4917109/pexels-photo-4917109.jpeg",   "aspect": "3:4",  "ev": 0 },
    { "key": "residence-05",    "url": "https://images.pexels.com/photos/15383436/pexels-photo-15383436.jpeg", "aspect": "3:4",  "ev": 0 },
    { "key": "residence-06",    "url": "https://images.pexels.com/photos/31325345/pexels-photo-31325345.jpeg", "aspect": "3:4",  "ev": 0 },
    { "key": "index-01",        "url": "https://images.pexels.com/photos/14222209/pexels-photo-14222209.jpeg", "aspect": "3:4",  "ev": 0 },
    { "key": "index-02",        "url": "https://images.pexels.com/photos/6665221/pexels-photo-6665221.jpeg",   "aspect": "3:4",  "ev": 0 },
    { "key": "index-03",        "url": "https://images.pexels.com/photos/9862523/pexels-photo-9862523.jpeg",   "aspect": "3:4",  "ev": 0 },
    { "key": "index-04",        "url": "https://images.pexels.com/photos/7784532/pexels-photo-7784532.jpeg",   "aspect": "3:4",  "ev": 0 },
    { "key": "band-discretion", "url": "https://images.pexels.com/photos/16634008/pexels-photo-16634008.jpeg", "aspect": "21:9", "ev": 0 }
  ]
}
```

Notes for Task 2b:
- Pexels image URLs accept resize parameters (`?auto=compress&cs=tinysrgb&w=2400`), which lets the script fetch a 2400 px master instead of the 6000 px original if bandwidth matters; the bare URL is the original.
- `https://www.pexels.com/download/video/<id>/` is a stable alias that 302-redirects to the same `videos.pexels.com` file; the manifest uses the resolved file URL so no redirect handling is needed.
- The Pexels HTML pages block plain curl (403); the CDN hosts do not. Fetch with a browser-like `User-Agent` regardless.
- Team silhouettes are not sourced here; they are generated placeholders per the ledger.
