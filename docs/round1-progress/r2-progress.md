# R2 Footer: progress checkpoint

Worktree `/home/kidus/projects/tnp-wt/r2-footer`, branch `round1/r2-footer`, pushed HEAD **016d855** (`wip(r2): compact footer ...`). Dev server port 3403 is stopped.

## Done (in 016d855)
- `src/components/Footer.tsx`: now Sitemap (the unchanged `liveNav().footer` groups) plus `.site-footer__base`: a hairline, `© <year> The New Practice` on the left (t-small, muted), `<Mark className="site-footer__mark">` on the right (18px wide, about 30px tall, stroke 6, brass point checked at 4x DPR: fill rgb(169,137,92)). Removed the Marquee, the `<address>`, the confidentiality line, and the lockup (wordmark, ™, tagline). Still a server component.
- `src/components/Footer.css`: rewritten. Padding `--s-6`/`--s-4`. Groups span 6 (two columns) below 768 and span 3 (four columns) from 768. Link gap `--s-2`, heading margin `--s-3`. Base margin-top is `--s-5`, or `--s-6` from 1024.
- Deleted `src/components/Marquee.tsx`. Removed `D.marquee` from `src/motion/tokens.ts`, `marqueeSeparator` from `UI_FOOTER` in `src/content/ui.ts` (docblock updated), and the dead `09 — FOOTER` block at the end of `src/app/sections.css` (old CSS marquee keyframes and `.site-footer__base`, both unused).
- `tests/e2e/footer.spec.ts`: the address, lockup and marquee tests are replaced by: no marquee/address/tel/mailto/wordmark/™/tagline/founder/confidentiality line (the last read from HOME); a base line with the copyright, no links, and exactly one aria-hidden mark whose point fill equals `--c-brass`; footer height under the viewport height; no running animations inside the footer. The legal-link gating assertions are kept.
- `tests/e2e/reduced-motion.spec.ts`: the `.marquee__track` transform assertion is replaced by `.marquee` count 0.
- `npm run verify` was green (336 unit tests, build OK) before the commit. One earlier build failed on a transient Google Fonts fetch; a retry passed.

## Heights on /about (footer bounding box, before → after)
390: 1807 → 465 · 768: 1392 → 330 · 1280: 1598 → 354 · 1920: 1647 → 354 · 1280 reduced motion: 1598 → 354.
Screenshots are in the scratchpad `r2/` folder (`before-*.png`, `after-*.png`, `mark-zoom.png`). I read all four "after" widths; the layout is clean.

## Remaining
1. **Fix 3 e2e failures** (the other 42 pass): `exposes contentinfo...` on mobile-390 and wide-1920, and `axe inside the footer` on wide-1920. All three are **30s test timeouts**, not assertion failures. They are probably dev-server slowness: the first test takes a full-page `screenshotRoute` on `/`, and axe runs cold on the dev server. Re-run first; if they still time out, run against a production build (`npm run build && npx next start -p 3403`). Log: `/tmp/claude-1000/r2-e2e-footer.log`.
2. Run `E2E_BASE_URL=http://localhost:3403 npm run e2e:route -- "reduced-motion"` (reduced-motion.spec.ts was edited).
3. **Docs** (not started), each in its own commit:
   - docs/05 §Footer: replace the table with Sitemap and Base line rows. Remove the Marquee, Contact, Legal line and Lockup rows. Fix the "Every string comes from ..." sentence (drop `pages/home.ts`) and the Playwright coverage line. Line ~305 (Footer row, "Marquee, contact, legal, the mark") → "Sitemap, © line, the mark".
   - docs/04 §4: delete "### Footer marquee". Line 81 `--e-linear` "footer marquee" → residences drift only. Line 251 reduced-motion row "Marquee, carousel" → "Carousel".
   - docs/03 §9: delete the `D.marquee` row and its sentence (lines ~252, 258). Line 91 `--t-hero` usage "Footer marquee" → note it has no current use (the token is still in globals.css; I did not remove it to avoid conflicts, and am reporting it as a finding).
   - docs/02 line 133 anti-patterns row: marquee is no longer permitted anywhere.
   - docs/09 line 83: drop "`Footer`'s `Marquee`" from the client-components list.
4. Re-read the reduced-motion screenshot (`tests/e2e/__screenshots__/reduced-motion/footer.png`) and the 390/768/1280/1920 e2e screenshots. Squash nothing; add a final `feat(footer)` or `docs(footer)` commit and push.

## Decisions and gotchas
- Kept `--t-hero` in globals.css (now unused) → finding. HANDOFF.md:95 and the plan file still mention the footer marquee → finding. Stale "footer marquee" comments sit in treatment/index/profile/interior-pages/contact/residences/assessment specs → finding (not edited; those specs belong to other tasks).
- On production only three groups show (no Legal). From 768 they take 9 of 12 columns, left-aligned. Below 768 the third group sits alone in the second row.
- Playwright needed `npx playwright install chromium` (build 1243); it is now installed.
- Do not use `pkill -f "next dev -p 3403"` from a bash call: it matches its own shell. Kill by PID instead (`pgrep -f "next dev -p 3403"`, but exclude the shell).
- Commit trailer: `Claude-Session: https://claude.ai/code/session_01VpEh8wQzWn6UJ1cRP8HDy1`, no co-author line.
