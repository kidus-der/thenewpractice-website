# Content Gaps and Decisions

> Written by Task 5 (content ingestion), 2026-09-14. Everything the client document does not supply, every contradiction in it, and every judgement the parser made while turning it into `src/content/**`. Line numbers refer to `Final Website Instructions_DRAFT Sept 1 2026 .docx.md`. Each entry says where it shows up, what the site does in the meantime, and who decides.

## 1. Gaps: content the document does not contain

| # | Gap | Where it appears | In the meantime | Decision needed |
| --- | --- | --- | --- | --- |
| G1 | **Residences page.** No copy at all for the hospitality / residences template (T5). | `/residences` | `src/content/pages/residences.ts` is hand-written structural copy, every string prefixed `PLACEHOLDER — `. It invents no fact about the property: no room counts, no pool, no address. Its amenities repeat only what the process and team pages already say (private residence, private chef, live-in Lead Clinician, transport and security, concierge). | **Client:** supply the residences text and photography, or confirm the page is dropped from the first release. |
| G2 | **Contact page blanks.** `Direct Telephone`, `Email` and `Website` are underscores (l.1243–1245). | `/contact`, footer | Phone and email resolve to `brand.ts` (the home-page values, l.106–107; owner decision in the ledger). `CONTACT.contact.website` is `thenewpractice.health`, marked `PLACEHOLDER` in the module comment. | **Client:** confirm the website domain and that the founder's direct line is the number to publish. |
| G3 | **Legal pages.** No privacy or terms text. | `/privacy`, `/terms` | Task 18 shipped `src/content/pages/legal.ts`: four headings per page (privacy: information collected, how it is used, retention and security, rights and contact; terms: use of the website, clinical information, intellectual property, governing law), each with one sentence saying the text is pending counsel, every string prefixed `PLACEHOLDER — ` and checked. Both routes are `noindex`, out of the sitemap (`NOINDEX_ROUTES`), and carry the eyebrow _Copy pending client review_ off production. The headings are ours and state no position; counsel may replace them wholesale. | **Client:** supply privacy policy and terms, or name the jurisdiction and counsel who will. |
| G4 | **Hero video and all photography.** The document briefs a 15-second surf-to-jungle film (l.10) and nothing else. | Home hero, every plate, team portraits | Stock, licence-free media per the owner decision (Tasks 2a/2b, `design/ASSETS.md`). Team pages use a generated silhouette placeholder (Task 14). | **Client:** commission or supply the hero film, residence photography and eleven portraits. |
| G5 | **Voice-over recording.** The script exists (l.8) and the direction (l.11: female, possibly British, warm, not commercial); no audio file. | Home hero audio toggle | `HOME.hero.audioScript` carries the words; `HOME.hero.audioSrc` is `null`, so the toggle does not render (Task 16). | **Client:** record the voice-over; **owner:** decide whether an interim synthetic read is acceptable for staging. |
| G6 | **Per-questionnaire interpretation lines.** The shared block (l.1024) has one interpretation, written for alcohol: "Higher scores suggest increasing levels of problematic alcohol use." | `/self-assessment/[slug]` result panel | The alcohol questionnaire gets the full sentence. The other nine get only its generic second sentence, "Moderate or severe scores indicate it may be helpful to seek professional support." Nothing is invented. **Shipped (Task 18b):** the result renders `interpretation` verbatim beneath the band label, so nine questionnaires today show the one generic sentence; a band `description` renders when present and none is. A new line per questionnaire is a one-field change in the source document. | **Client:** write one interpretation line per questionnaire (nine needed). |
| G7 | **Metadata descriptions, `llms.txt` summary, form labels, confirmation copy.** | `<head>`, `/contact` | Written by Tasks 10 and 15 in the brand voice (docs/01); interface copy is ours and is not marked. | **Owner:** review at Task 10/15. |

## 2. Contradictions and inconsistencies in the document

| # | Issue | Lines | Resolution |
| --- | --- | --- | --- |
| C1 | **Assessment scoring.** The how-to section specifies a 0–3 scale per question with bands 0–10 / 11–20 / 21–35 / 36+ (l.974–986). Every questionnaire's shared block specifies 1 point per "yes", 0–15, bands 0–4 / 5–9 / 10–15 (l.1020–1023). | 974–986 vs 1018–1024 | **Owner decided:** per-questionnaire yes/no scoring wins. `ASSESSMENTS[n].scoring` carries it. The how-to section renders only its first sentence; the 0–3 scale and General Guide are preserved as `ASSESSMENT_SERIES.supersededScale` with a do-not-render comment. Note the General Guide's 11–20 and 21–35 rows carry the same description (l.984–985), a copy error in the source. **Client** to confirm and to reword the how-to if the 0–3 scale is retired. **Shipped (Task 18b):** the scorer reads `ASSESSMENTS[n].scoring` only — one point per yes, 0–15, bands 0–4 / 5–9 / 10–15 with the labels *Mild / Moderate / Severe concern* — and the title page of every questionnaire quotes the series' own scoring line; the 0–3 scale and its General Guide render nowhere. |
| C2 | **Founder's role wording.** Home and contact say "Founder & Clinical Director" (l.104, 172, 1242, 1277); the team page says "Founder and Clinical Director" (l.785). | 785 | Verbatim in `TEAM[0].role`; `brand.ts` uses the ampersand. **Client:** pick one. |
| C3 | **Location string.** Home: "Puerto Aventuras / Riviera Maya / Mexico" (l.108–110). Contact: adds "Quintana Roo" (l.1248–1250). | 108–110 vs 1248–1250 | `brand.ts` uses the fuller contact-page form everywhere; the home block references it. |
| C4 | **Years of experience.** "more than twenty five years" (l.128), "more than 20 years" (l.159, 787), "over the past four decades" (l.1257), "almost thirty years" for Patricia (l.877). | 128, 159, 787, 1257 | Verbatim; not reconciled. **Client:** confirm the founder's figure. |
| C5 | **Spelling drift.** "individualized" (l.25, 404, 523 …) beside "Individualised" (l.230); "program" throughout beside "programme" in our docs; "after care" (two words) throughout beside "aftercare" nowhere; "recognize/recognise", "organisation/organization", "counsellor/counselors" mixed. | throughout | Verbatim, per the copy rule. **Client:** decide British or North American and we apply it in the source document, not in the modules. |
| C6 | **Hero title casing.** The document sets the overlay title in caps, "A NEW APPROACH TO WELLBEING" (l.13); the owner's brief specifies title case. | 13 | `HOME.hero.title` is title case per the brief; the generator asserts it equals the document ignoring case. Section titles elsewhere keep the document's caps ("ABOUT THE NEW PRACTICE", "PUERTO AVENTURAS", "A MESSAGE FROM THE FOUNDER", "THE NEW PRACTICE EXPERIENCE"); templates may transform. |
| C7 | **Copy-deck vocabulary in the client's own text.** "luxurious" (l.16), "journey" (l.157, 715–717, 879, 932, 1014, 1259), "bespoke" (l.795), "unparalleled" (l.92). | as listed | Theirs; not edited (docs/01 and docs/06 rule). **Client:** aware. |
| C8 | **Iona Hames's final paragraph has no full stop** (l.852). Caroline Adams's biography opens `Caroline "Caro" Adams` with straight quotes (l.895). Dr. Vasquez-Whitfield's biography has no first-line introduction of her role, unlike the other ten (l.817). | 852, 895, 817 | Verbatim. **Client:** supply a closing full stop, confirm the nickname, add an opening line for Dr. Vasquez-Whitfield if wanted. |
| C9 | **"Our Logo \- The Ceiba"** (l.115) uses a hyphen-minus, not the em dash our docs use. | 115 | Module title is `Our Logo - The Ceiba` exactly as written; templates decide the glyph. |

## 3. The ™

Main-session decision (ledger, Task 1 triage): render the trademark at most once per page, in the home hero wordmark and the footer lockup, as a superscript at `--t-eyebrow`; never in the header or running text. The content layer keeps it separate as `BRAND.trademark`. Two verbatim strings carry it inside client copy and are left as written: `ASSESSMENT_SERIES.seriesTitle` ("THE NEW PRACTICE™ SELF-ASSESSMENT SERIES", l.1019) and "Intuitive Reconnection Massage™" in Nicolas Neduchal's biography (l.930). Patricia Heyland's "Somatic Experiencing®" (l.883) likewise. **Owner:** confirm the assessment series title renders without its ™ under the once-per-page rule, or that the rule exempts client copy.

## 4. Parsing judgements

The generator (`scripts/ingest-content.mjs`) is generic where the document is regular and targeted where it is not. Every place judgement replaced grammar:

| Lines | What the document does | What the module does |
| --- | --- | --- |
| 5 | `Website title: THE NEW PRACTICE™` | Not stored; `brand.ts` already carries name and ™. |
| 6, 10, 11, 16 | Video and audio direction, one line each | Joined with newlines into `HOME.hero.videoBrief`, plus the "ONLY AUDIO." tail of l.8. The escaped asterisks bracketing l.16 are dropped as decoration. |
| 8 | Audio script in curly quotes, then **ONLY AUDIO.** | `HOME.hero.audioScript` is the spoken words without the enclosing quotation marks. |
| 18 | `ADD: Scroll to discover (prompting user to scroll down to learn more)` | `HOME.hero.cue` references `UI.scrollCue`; the generator asserts the document still says the same. The parenthetical is a note and is dropped. |
| 22–23 | `Section 1:` followed by a single `Subtitle:` | Section `subtitle`. Rule: a lone subtitle with nothing before it belongs to the section. |
| 47 | `BODY:` is only the list's introducing sentence | `listHeading`; `paragraphs` is empty. |
| 66–79 | Five pillars, each a short title line hard-broken over one sentence | `definitions` (term + description). Rule: a chunk of exactly two lines, the first ≤ 60 characters without sentence-final punctuation, the second ending in one. |
| 81–92 | A `Subtitle:` after content within Section 4 | Subsection `why-the-new-practice`. Rule: any subtitle preceded by content opens a subsection. |
| 91–92 | One paragraph wrapped over two hard-broken lines ("…and absolute" / "confidentiality…") | Joined with a space. Rule: a line ≥ 60 characters ending in a lowercase letter, comma, semicolon or hyphen continues onto the next; a trailing hyphen joins without a space (l.492, 505: "trauma-" + "informed"). |
| 92 | "restoring health- not simply" | Verbatim, including the hyphen spacing. |
| 103–110 | Founder block after the §5 prose | Cut from `paragraphs` at the founder's name; `HOME.contact` references `brand.ts`. The generator asserts phone and email in the document equal `brand.ts`. |
| 123–126 | `Section 1:` + `Subtitle:` + `Header:` | `subtitle` and `header` (the one `Header:` in the document; `sectionSchema.header` exists for it). |
| 171–172 | "Lowell Monkhouse" / "Founder & Clinical Director" closing the founder's message | `signature` on the section (`PAGES.about.signatureLines`). |
| 176–223 | Section 3 with four `Subtitle:` groups | Four subsections; the section itself has no paragraphs. |
| 192–193, 315–316, 860–861, 927–928, 1013–1014 | Complete sentences hard-broken onto the next line | Separate paragraphs (the join rule requires an unfinished sentence). |
| 226–246 | Six principles in the pillar pattern | `definitions`. |
| 252–262, 1201–1206 | Page intro before Section 1 | A leading section; its first paragraph is **moved** to the page `lead` (`PAGES.*.lead`), not copied. Only Our Process and Contact do this. |
| 388 | `Section 11:` title not italicised | No effect. |
| 422–454 | Addiction Treatment: "Treatment may include:" list, then "We provide individualized treatment for … problems with:" list, then a closing paragraph | `mayInclude` (heading matches /may include/i), `treats`, `outro`. The document's order is mayInclude **before** treats; the schema has no order field, so the treatment template should render `mayInclude` first when both exist. Only this service has both. |
| 479–517 | "Trauma-Focused Treatment May Include…" as `Name: description` lines wrapped across 2–5 physical lines | Subsection whose paragraphs are split at the first ": " into `definitions` (`SERVICES.definitionSubsections`). The final two sentences of l.516–517 ("The objective is not to make a client repeatedly relive traumatic events. It is to help…") read as a closing statement for the whole subsection but sit inside the last modality's paragraph in the source; they are kept there verbatim. **Client:** confirm whether they should be a separate closing paragraph. |
| 641 | A word-joiner (U+2060) before "Reduced" | Stripped, with zero-width spaces, BOMs and non-breaking spaces everywhere. |
| 658 | `***Subtitle: After care needs***` (colon inside the bold) | Parsed as a subtitle; subsection `after-care-needs`. |
| 719–729 | Team page body before Section 1 | `TEAM_PAGE.sections[0]` (`intro`). |
| 731–777 | Section 1 with three subtitles | Three subsections; the list's two trailing paragraphs become `outro`. |
| 781–948 | Section 2, members separated by `---`; first line name, second role | `TEAM`. Name line split at ", " into `name` + `credentials` ("Lowell Monkhouse, MA", "Dr. Elena Vasquez-Whitfield, M.D.", "Patricia Heyland, MSc"). Slugs drop "Dr." and diacritics (García → garcia). Order as in the document. |
| 807 | `**$15 million**` bold inside a paragraph | Emphasis stripped; text kept. |
| 813 | `***Dr. Elena Vasquez-Whitfield, M.D.** *` (stray space inside the markers) | Cleans to the plain name. |
| 839–840 | Iona's name and role on consecutive lines without a blank | Handled: the first two text lines of a member block are always name and role. |
| 972–986 | How-to with the 0–3 scale and General Guide | See C1. `paragraphs` keeps only the first sentence; the rest is `ASSESSMENT_SERIES.supersededScale`. |
| 1003 | `* *Adult Children of Alcoholics & D*ysfunctional Families Assessment` (broken emphasis) | Cleans correctly; the generator asserts the "Available" list equals the ten questionnaire titles. |
| 1018–1026 | Shared scoring block | `ASSESSMENT_SERIES.toolLabel / seriesTitle / scoringText / instruction`; bands into each questionnaire's `scoring.bands` with keys mild / moderate / severe and the document's labels. |
| 1028–1196 | Ten questionnaires, `N\.` titles, tab-indented `N\.\t` questions | Number prefixes stripped; short slugs from `ASSESSMENTS.questionnaires` in the config (`alcohol`, `drugs`, `gambling`, `food`, `eating-disorders`, `sex-and-pornography`, `work`, `social-media-and-technology`, `codependency`, `adult-children`), each asserted against the title. |
| 1197 | `**CONTACT**` directly after the last question, no blank line | Marker detection is by text, so it splits correctly. |
| 1240–1250 | Contact §3: sentence, name, role, three blank fields, organisation, three address lines | `paragraphs` keeps the sentence; `CONTACT.contact` references `brand.ts`; the generator asserts name, role, organisation and the joined address equal `brand.ts`. |
| 1251 | `A Personal Message // THANK YOU` | Page title "A Personal Message", eyebrow "THANK YOU". |
| 1273–1279 | "Warm regards," then name, role, organisation | "Warm regards," stays the last paragraph; the last three lines are the page `signature`. |
| 1283 | `CLOSING SECTION: Cost` | `FEES.title` is "Cost" (the client's word); the route is `/fees` and the nav label "Fees" per the plan. |
| all | Page titles "Home", "About", "Our Process", "Clinical Services", "Team", "Self-Assessment", "Contact" | Ours, derived from the page markers; not client copy. |
| all | Trailing double-space hard breaks, `\-` `\.` `\+` `\_` escapes, markdown links, doubled spaces | Stripped or unescaped; the mailto link (l.107) reduces to its text. |

## 5. How to close a gap

Edit the client document, not the module, then run `node scripts/ingest-content.mjs` and `node --experimental-strip-types scripts/check-content.ts` (or `npm test` once Task 4 lands). If the document changes shape, the generator asserts and names the line; fix the config first, the parser second.
