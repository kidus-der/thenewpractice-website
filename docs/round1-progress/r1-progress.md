# R1 — Images: progress checkpoint (paused)

Worktree `/home/kidus/projects/tnp-wt/r1-images`, branch `round1/r1-images`. HEAD = pushed = `84eae0d` (no R1 commits yet; worktree clean). `npm ci` done. No dev server was started.

## Slots done
None committed. Research phase only.

## Slots planned (31; keys by slot; aspect 3:4 unless noted)
Home: `home-recovery` (§2 Recovery Without Interruption: live-in clinician by your side, accompanies you home → two people walking side by side from behind), `home-who-we-help` (§3 one fixed image beside the 12 conditions → lone adult seated by a window / in shade, face not shown), `home-philosophy` (§4, 21:9 band possible → ceiba / great tree, "innate capacity to heal"), `home-begin-conversation` (§5 "we invite you to contact us directly" → hand/phone at window, or two chairs facing).
About: `about-ceiba` (Our Logo – The Ceiba → a real ceiba trunk/crown), `about-practice` (program built around the client, private clinical residence → tropical-modern interior), `about-founder` (people recover through relationships → two people in conversation, hands/backs only; never imply it is Lowell), `about-sea` (Caribbean Sea: "morning walks beside the water" → lone figure walking the shore at dawn, from behind), `about-jungle` (Healing Power of the Mayan Jungle: ancient trees, cenotes → cenote with roots / jungle light). Optional `about-place` (Privacy, Safety and Peace: marina, quiet canals).
Our Process (5): `process-first-call` (first conversation: we listen → person on phone at window), `process-lead-clinician` (breakfast, a walk, quiet conversations → two people walking/sharing a meal), `process-typical-day` (morning calm of the Caribbean, breakfast by private chef), `process-family` (Family Participation → adults of one family together, candid), `process-nutrition` (Nutrition as Therapy → chef's hands, fresh food).
`personal-message` (letter; "a single conversation can change the direction of a life" → handwritten letter / pen on desk). `fees` (all-inclusive treatment in Puerto Aventuras → residence terrace to canopy / shaded veranda).
`services-index` (no two people arrive with the same history → consultation, hands/notes). Services (11): `service-addiction-treatment` (glass of water, a life not dependent on alcohol), `service-trauma-and-complex-trauma` (figure seated alone in soft light, unidentifiable), `service-mental-health` (person at window, contemplative), `service-eating-disorders` (hands around a simple bowl; "rarely about food alone"), `service-executive-health-and-burnout` (man in shirt, jacket off, looking at the sea / empty desk chair), `service-biochemical-restoration` (fresh produce on stone, citrus, herbs), `service-somatic-therapies-and-nervous-system-regulation` (hands on chest/abdomen, breathwork; NO yoga pose), `service-inner-child-work` (adult hand holding child's hand, or child walking away), `service-recovery-management-and-after-care` (arriving home, doorway, walking up to a house together), `service-interventions-and-crisis-response` (worried person on phone at night, hands clasped), `service-family-program` (adult family walking together).
`team-index` (one integrated clinical team → colleagues around a table, hands/notes), `assessment-index` (reflect honestly → hands writing in a journal), `contact` (seeking help can feel overwhelming → phone by window / hand on phone).

## Candidate search results (not yet viewed)
`scratchpad/r1/q/<group>.tsv` (page URL, alt, thumb URL): ceiba, walk2, window, cenote, seawalk, marina, interior, jungle, phone, consult, notebook, letter, breakfast (partial). Groups still to search (listed in `scratchpad/r1/queries.txt`): breakfast (rerun), chef, produce, family, seated, glass, exec, breath, child, home, crisis, team, terrace. Also try Unsplash (`node search.mjs unsplash ...`, filter `?license=free`, exclude Unsplash+) — untested.
Early notes from alt text: ceiba — Pexels 34041295 and 30272168 (spiny ceiba trunk close-ups), 31546932 (Key West ceiba crown), 7292924 (kapok bark in tropical woods), 3191101 (tall kapok in rainforest). Avoid the flowering silk-cotton (India/Bangladesh) results.

## Tooling (scratch, not committed)
- `scratchpad/r1/search.mjs <pexels|unsplash> "q1" "q2"…`: Playwright chromium, fresh context per query (a second navigation in one context gets Cloudflare 403). Prints `href\talt\tthumbSrc`.
- `scratchpad/r1/sheet.mjs q/<group>.tsv s-<group> 24`: downloads thumbs, writes a numbered 6-col JPG grid + `.idx.tsv`. Read the JPG to judge. (sharp loaded via createRequire from the worktree.)
- `runall.sh` loops `queries.txt`; ~40 s per group; run in background, it exceeds 10 min.

## Gotchas
- Pipeline regenerates ALL stills. On this Linux box sharp re-encodes the 15 existing frames with different bytes and 3 LQIPs change in `media.ts`. After each `npm run assets`: `git checkout -- public/media/<old keys>` for the 15 existing keys (hero-poster, residence-01..06, index-01..04, band-discretion, hero-surf/canopy/cenote-poster) and keep the old LQIP strings in `media.ts` for those keys (only add new entries). The Fact-Forcing hook asks for facts before `git checkout --`.
- The node_modules cache is empty in a fresh worktree. Poster frames were rebuilt from committed loops (no video re-encode): `ffmpeg -ss 1 -i public/video/<k>.mp4 -frames:v 1 node_modules/.cache/tnp-media/posters/<k>-poster.png` for hero-surf/canopy/cenote. Without them, `npm run assets` DROPS the poster and VIDEO entries from media.ts. Redo this if the worktree is recreated.
- ffmpeg/ffprobe present at /usr/bin; sharp 0.35.4 works (npm install-scripts warning is harmless).
- docs/08 still says "Never use an image with an identifiable face"; owner decision now allows Kusnacht-style people. R0 rewrites docs/02; docs/08 hard-rule row still needs updating (by R1 in the same commit as the first people photo, or flag for R0). Keep people in crisis-themed slots (trauma, mental health, addiction, crisis) unidentifiable: Pexels licence forbids showing identifiable people in a bad light.
- Unsplash licence: free, commercial, no attribution; exclude Unsplash+ (premium) images. Pixabay search not yet tried (API needs a key; HTML via Playwright probably works).

## Exact next steps
1. Rerun remaining groups (`runall.sh` from `breakfast` onward, in background).
2. For each group: `node sheet.mjs q/<g>.tsv s-<g> 30`, Read the JPG, shortlist 2–3 per slot, download the full-size candidates (`https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg`) and Read them before choosing.
3. Add chosen entries to `design/media.manifest.json` (key, slot, page, url, credit, licence, licenceUrl, aspect, focus, ev, factual alt); `npm run assets`; restore old keys as above; Read each graded WebP and tune `ev`; check sizes vs budgets (3:4 ≤ 120 kB, 21:9 ≤ 150 kB, 16:9 ≤ 180 kB).
4. Commit + push per batch (home; about; process + message + fees; services; index pages + contact), each with its ASSETS.md rows, STOCK-SOURCES.md round-1 section rows, ROUND1-IMAGE-SLOTS.md rows. Conventional messages, no co-author trailer; end with the Claude-Session line per the attribution reminder.
5. Contact sheet of all new graded frames with keys → `scratchpad/r1/contact-sheet.png`. `npm run verify` green. Report.
