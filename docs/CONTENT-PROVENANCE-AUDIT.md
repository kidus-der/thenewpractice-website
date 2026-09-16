# Content Provenance Audit

> Read-only audit of every user-visible string in `src/**` against the client's document (`Final Website Instructions_DRAFT Sept 1 2026 .docx.md`, cited below as `l.N`), the identity PDF (`design/brand/The New Practice - Logo Concept.pdf`, cited as `PDF`), the ledger's owner decisions (`docs/BUILD-LEDGER.md`) and `docs/CONTENT-GAPS.md`. Written 2026-09-15 on `main` at commit `0e948d6`. Nothing was changed.
>
> Method. Every content module under `src/content/**` was imported and every string leaf walked (1,065 strings). Each was normalised (markdown emphasis and escapes stripped, whitespace collapsed, curly and straight quotes equal, every dash variant equal) and searched for in the normalised document and PDF. Matches were classified automatically as VERBATIM or DERIVED (case only); everything else was classified by hand. The rendering layer (`src/app/**`, `src/templates/**`, `src/sections/**`, `src/components/**`, `src/lib/jsonld.ts`, `src/lib/og.tsx`, `src/lib/seo.ts`, `src/app/llms.txt/route.ts`, `src/server/**`) was read in full for literals and for what it does to the content strings before they render. Metadata descriptions were generated through the same `excerpt()` the site uses, so truncations reported here are the ones that ship.

## 1. Summary

| Classification | Count | Notes |
| --- | ---: | --- |
| VERBATIM | 865 | Includes two definitions whose only difference is the document's hard-broken `trauma-` / `informed` join (l.492, l.505). |
| DERIVED | 54 | Case changes, truncations, joins and re-compositions with no new fact. 22 are questioned in Section D. |
| IDENTITY | 7 | Name, wordmark, ™, tagline, mark story, the two title compositions built from them. |
| INTERFACE | 78 | Labels, landmarks, buttons, form copy, alt text describing stock frames, photographer credits, dev-route copy. |
| INTERFACE-CLAIM | 14 | Interface strings that state something checkable. Section B says whether the code supports each. |
| PLACEHOLDER | 49 | 48 prefixed `PLACEHOLDER — ` (residences 28, legal 20) plus one unmarked (`CONTACT.contact.website`). Section C. |
| UNSOURCED | 27 | Section A. Some rows render on many pages (the 10 questionnaire descriptions, the 11 service JSON-LD types, every page's Organization node). |

Totals count distinct source strings, not renderings. A string that matched the document only after a case change is counted DERIVED even where the change is trivial (`About`, `Our Process`).

The pattern is clear: the client's prose (pages, services, team, questionnaires) is verbatim to the letter, including the client's own inconsistencies. Everything unsourced lives in three places we wrote ourselves: the search metadata (`src/content/seo.ts`), the structured data (`src/lib/jsonld.ts`), and a handful of interface labels (`src/content/ui.ts`, `src/content/nav.ts`).

## 2. Section A — UNSOURCED findings

Severity: **Claim** states a fact about the practice; **Descriptive** is colour without a checkable fact; **Structural** is a label or classification that implies content or a relationship the document does not make.

### A.1 Strings that render on the page

| # | Exact string | Source | Renders at | Why unsourced | Severity | Minimal fix |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | `Ceiba pentandra · Ya’axché` | `src/content/ui.ts:46` | `/about`, `<figcaption>` under the drawn mark (`CeibaFigure`) | Neither the document nor the PDF names the species or gives the Yucatec Maya name. The document says only "the ceiba" (l.115–119); the PDF says "the ceiba tree — the sacred 'world tree' of Maya belief". True or not, it is our fact. `docs/01-brand-strategy.md §On the Maya material` says to "state it plainly and briefly, then stop" and does not authorise this caption. | Claim | Delete the caption, or replace with `The Ceiba` (l.115). |
| A2 | `Fifteen questions` | `src/content/ui.ts:86` | `/self-assessment` beneath each of the 10 rows; `/self-assessment/[slug]` as the `<h2>` over the questions | The document never writes the word "fifteen"; it numbers 15 questions and says "Total score: 0–15" (l.1020). The count is enforced by the content test, so it cannot be wrong, but it is our sentence. | Structural | Delete (the lead already shows l.1020), or replace with `Total score: 0–15` (l.1020). |
| A3 | `Residences` | `src/content/nav.ts:47,66`; `src/content/seo.ts:161` | Header, nav overlay, footer *Care* column, breadcrumb, previous/next rails, `<title>`, OG card | The document has no residences page and no residences copy (CONTENT-GAPS G1). The label promises a page; the page behind it is entirely `PLACEHOLDER`, yet the route is in the primary navigation, indexable, and in the sitemap at priority 0.8. | Structural | Move the route behind the staging flag (drop from `NAV.primary`, `NAV.footer` and the sitemap in production) until the client supplies copy. |
| A4 | `Privacy`, `Terms` | `src/content/nav.ts:77–78`; `src/content/seo.ts:181,184` | Footer *Legal* column on every page; `<title>`; breadcrumb | No such text exists (G3). The routes are `noindex` and out of the sitemap, but every production page links to a stub whose `<h1>` reads `PLACEHOLDER — Privacy`. | Structural | Hide the *Legal* column until counsel's text exists, or accept the visible stubs. |
| A5 | `Amenities` | `src/content/ui.ts:73` | `/residences`, `aria-label` on the amenities section | Names a list of amenities the client never wrote; the list itself is `PLACEHOLDER`. Screen-reader-only. | Structural | Gated with the page (A3). |

### A.2 Strings that ship in `<head>`, Open Graph, JSON-LD and `llms.txt`

These are read by search engines, link previews and language models, and `llms.txt` repeats every route description verbatim (`src/app/llms.txt/route.ts:41–44`), including the two `noindex` legal routes.

| # | Exact string | Source | Renders at | Why unsourced | Severity | Minimal fix |
| --- | --- | --- | --- | --- | --- | --- |
| A6 | `Psychiatric` (`medicalSpecialty`) | `src/lib/jsonld.ts:44,88` | `Organization` JSON-LD on every page | The document never names a medical specialty for the practice. The code comment argues "a consulting psychiatrist on the team" supports it; the document describes "a private behavioural health practice" (l.25) with psychiatry as one of a dozen disciplines (l.87). | Claim | Delete the property. |
| A7 | `MedicalBusiness` (`@type`) | `src/lib/jsonld.ts:42` | `Organization` JSON-LD on every page | A schema.org classification the client did not make. The client's own words are "private behavioural health practice" (l.25). Defensible, but it is our categorisation of a regulated kind. | Structural | Owner decides: keep, or reduce to `Organization`. |
| A8 | `MedicalWebPage` (`@type`) with `about: { name: <service title> }` | `src/lib/jsonld.ts:163–168` | 11 service pages | Same categorisation as A7 applied to each service page. The `about` value is the client's title, so nothing else is added. | Structural | Owner decides: keep, or `WebPage`. |
| A9 | `How The New Practice began, from The Kusnacht Practice in 2007 to Puerto Aventuras today. The founder’s message, the ceiba mark and our principles.` | `src/content/seo.ts:146` | `/about` `<meta description>`, `og:description`, `WebPage.description`, `llms.txt` | Our composition. It can be read as The New Practice beginning in 2007; the document says The Kusnacht Practice began in 2007 (l.132), that The New Practice continues that model (l.130), and that it was established in Mexico in 2025 (l.797). | Descriptive, borders on Claim | Replace with l.126 verbatim: `A New Standard in Private Behavioural Healthcare`, or l.124 + l.126. |
| A10 | `From the first telephone call to after care: assessment, a programme designed for one person, a live-in Lead Clinician, and the return home.` | `src/content/seo.ts:150` | `/our-process` metadata, OG, JSON-LD, `llms.txt` | Paraphrase in our words. "programme" is our spelling; the client writes "program" throughout (CONTENT-GAPS C5). | Descriptive | Replace with l.254 verbatim: `For many people, making the first telephone call is the most difficult step in building a new life.` |
| A11 | `A personal message from Lowell Monkhouse, Founder and Clinical Director of The New Practice, for anyone considering treatment.` | `src/content/seo.ts:154` | `/a-personal-message` metadata, OG, JSON-LD, `llms.txt` | "for anyone considering treatment" paraphrases l.1265. | Descriptive | Replace with l.1269 verbatim: `Sometimes a single conversation can change the direction of a life.` |
| A12 | `The all-inclusive weekly fee for treatment in Puerto Aventuras, and how the cost of treatment at home or elsewhere in the world is set.` | `src/content/seo.ts:158` | `/fees` metadata, OG, JSON-LD, `llms.txt` | Paraphrase of l.1285. "how the cost … is set" is not what the document says ("will be provided on a case-by-case basis"). | Descriptive | Replace with the second sentence of l.1285 verbatim, or the first if the owner wants the figure in search results. |
| A13 | `A private clinical residence in Puerto Aventuras, on the Riviera Maya, where treatment and everyday life exist together.` | `src/content/seo.ts:162` | `/residences` metadata, OG, JSON-LD, `llms.txt` | Re-composed from l.136 and l.293 to describe a page whose body is `PLACEHOLDER`. Not marked, not gated, indexable. | Descriptive | Mark `PLACEHOLDER — ` or gate with the route (A3). If kept, use l.291 verbatim: `On arrival, you will be welcomed into your private residence in Puerto Aventuras.` |
| A14 | `Eleven clinical services, from addiction and trauma to eating disorders, executive burnout, somatic therapies, recovery management and the family program.` | `src/content/seo.ts:166` | `/clinical-services` metadata, OG, JSON-LD, `llms.txt` | Our count and our summary. The count is enforced by the content test. | Structural | Replace with l.404 verbatim: `Individualized Treatment for Complex Human Problems`, optionally + l.412. |
| A15 | `The clinical and operations team at The New Practice, led by Lowell Monkhouse, Founder and Clinical Director. One client. One team.` | `src/content/seo.ts:170` | `/team` metadata, OG, JSON-LD, `llms.txt` | "clinical and operations team" and "led by Lowell Monkhouse" are our composition (the document says programs are led by the Clinical Director, l.735, and that Lowell holds that role, l.785). "One client. One team." changes the case of l.731. | Descriptive | Replace with l.723 verbatim: `The quality of any treatment program is ultimately determined by the quality of the people delivering it.` |
| A16 | `Ten confidential self-assessments, from alcohol and drugs to work, technology, codependency and family history. Nothing you enter is stored.` | `src/content/seo.ts:174` | `/self-assessment` metadata, OG, JSON-LD, `llms.txt` | Our count; "family history" is our gloss for *Adult Children of Alcoholics & Dysfunctional Families* (l.1003). The last sentence is an interface claim (B1). | Structural | Replace with l.992 verbatim: `The New Practice currently offers the following confidential self-assessments:` trimmed of its colon, or l.962. |
| A17 | `Begin the conversation. Every enquiry is handled personally, in complete confidence, by Lowell Monkhouse, Founder and Clinical Director.` | `src/content/seo.ts:178` | `/contact` metadata, OG, JSON-LD, `llms.txt` | The document says every enquiry "is handled personally, professionally, and with complete confidentiality" (l.1206) and lists Lowell as the person to contact (l.1240). It does not say Lowell handles every enquiry. The form itself delivers to whatever `ENQUIRY_TO_EMAIL` is set to. | Claim | Replace with l.1206 first sentence verbatim: `At The New Practice, every enquiry is handled personally, professionally, and with complete confidentiality.` |
| A18 | `How The New Practice handles the personal information of visitors and enquirers.` | `src/content/seo.ts:182` | `/privacy` `<meta description>`, OG, JSON-LD; `llms.txt` (the route is `noindex` but `llms.txt` lists it anyway) | Describes a policy that does not exist. Not marked `PLACEHOLDER`. | Structural | Mark `PLACEHOLDER — `; exclude `NOINDEX_ROUTES` from `llms.txt`. |
| A19 | `The terms on which The New Practice website is provided.` | `src/content/seo.ts:184` | `/terms`, as A18 | As A18. | Structural | As A18. |
| A20 | `<title>. Fifteen yes-or-no questions, scored here in confidence. Nothing you enter is stored.` | `src/content/seo.ts:210` | 10 questionnaire pages: metadata, OG, JSON-LD | "Fifteen yes-or-no questions, scored here in confidence" is ours (count and "yes-or-no" are code-supported; "in confidence" is our characterisation). Last sentence is B1. | Structural | Replace the middle sentence with l.1020 verbatim: `Scoring: Give yourself 1 point for each “yes” answer. Total score: 0–15.` |

### A.3 Unsourced facts inside strings that are correctly marked `PLACEHOLDER`

These render in production with the visible prefix `PLACEHOLDER — `, so a visitor is warned. They are listed because the owner asked for every invented fact. All at `src/content/pages/residences.ts`; all render on `/residences`.

| # | Exact string (prefix omitted) | Line | What the document says instead | Severity |
| --- | --- | --- | --- | --- |
| A21 | `A private house, without a name on the gate.` | 20 | Nothing about a gate or a nameplate. | Descriptive |
| A22 | `One client, one house, one team. Treatment and everyday life exist together here, in Puerto Aventuras, at a pace set by the person in recovery.` | 22 | l.293 "a comfortable home where treatment and everyday life naturally exist together"; l.330 "your program reflects your individual pace". "one house" is ours. | Descriptive |
| A23 | `The rooms are arranged for a single client and the team who live and work alongside them.` | 28 | Nothing about rooms or their arrangement. | Claim |
| A24 | `Nothing on the street announces what happens inside.` | 29 | Nothing. | Claim |
| A25 | `Mornings begin with the sea. Meals are prepared by a private chef to the programme's nutritional plan. Sessions take place in the house, in the garden, or on the water.` | 36 | l.324 covers mornings and the chef. "in the garden, or on the water" is ours; the document's "tropical gardens" (l.193) are the community's, and no session is placed on the water. | Claim |
| A26 | `There are no waiting rooms and no shared schedules.` | 37 | l.330 "no crowded waiting rooms, institutional routines"; "no shared schedules" is ours. | Descriptive |
| A27 | `Puerto Aventuras is a private gated community on the Riviera Maya. The residence sits within it; access, transport and security are arranged by the practice.` | 44 | l.182 supports the first sentence. "The residence sits within it" is implied by l.291; "arranged by the practice" is ours (the roles exist at l.771–772). | Descriptive |
| — | Plate captions `The approach`, `The terrace`, `Linen`, `Limestone`, `The water`, `The canopy` and their alts | 49–70 | Name stock photographs as parts of the residence. Marked. | Descriptive |
| — | Amenities `Private residence`, `Live-in Lead Clinician`, `Private chef`, `Concierge and client services`, `Transportation and security` | 73–77 | Each is in the document (l.291, l.303, l.766, l.771, l.772). The framing as "amenities" is ours. | Structural |

## 3. Section B — INTERFACE-CLAIM strings

| # | String | Source | Renders at | Claim | Does the code support it? |
| --- | --- | --- | --- | --- | --- |
| B1 | `Nothing you enter is stored.` | `src/content/seo.ts:174,210` | `/self-assessment` and 10 questionnaire descriptions; `llms.txt` | No answer is persisted or transmitted. | **Yes.** `AssessmentForm` holds answers in a `useReducer` state only (`src/sections/AssessmentForm.tsx:136–140`); `src/lib/assessment.ts` has no storage, network or clock; there is no `<form>`, no fetch, no cookie, no analytics on the site. |
| B2 | `Thank you. Your enquiry has reached us.` | `src/content/enquiry.ts:69` | `/contact` after submit | The enquiry was delivered. | **Only when Resend is configured.** `createMailAdapter` (`src/server/mail.adapter.ts:124–135`) falls back to `createLogAdapter` when `RESEND_API_KEY` or `ENQUIRY_TO_EMAIL` is unset; that adapter writes a log line and returns `ok: true`, so the visitor sees this confirmation although nothing was sent to anyone. Staging runs that way today (ledger Task 15). A production deploy with either variable missing would silently do the same. |
| B3 | `It will be read personally and answered in confidence.` | `src/content/enquiry.ts:70` | `/contact` after submit | A promise about the practice's behaviour. | **Partly sourced, not code-checkable.** l.1206 says enquiries are "handled personally … with complete confidentiality". "answered" is ours. The code cannot guarantee either. |
| B4 | `If the matter is urgent, please telephone.` | `src/content/enquiry.ts:71` | `/contact` after submit | Implies the telephone is the faster channel. | Not checkable; the number is the client's (l.106). |
| B5 | `Your enquiry could not be sent. Please telephone or write to us directly.` | `src/content/enquiry.ts:75` | `/contact` on failure | The send failed. | **Yes**, on transport or API failure. Also shown, by design, when the honeypot or the timing check rejects a submission (`src/server/enquiry.handler.ts:49–61`), where nothing was attempted. |
| B6 | `Please enter a telephone number, including the country code.` | `src/content/enquiry.ts:57` | `/contact` field error | The field requires a country code. | **No.** The pattern (`src/server/enquiry.schema.ts:17`) makes the leading `+` optional; a number without a country code passes. The message over-claims. |
| B7 | `© {year} The New Practice` | `src/components/Footer.tsx:96–100`, `src/content/ui.ts:28` | Footer on every page | Copyright is asserted in the practice's name for the build year. | Legal boilerplate the client did not supply; the year is the build date (`new Date()` at build). |
| B8 | `Portrait to follow` | `src/content/ui.ts:127` | 11 profile pages, `aria-label` on the placeholder plate (screen readers only) | A portrait will be supplied. | Not checkable; the client has not committed (G4). Ships in production. |
| B9 | `Works alongside` | `src/content/ui.ts:129` | 11 profile pages, `<h2>` over three colleagues | These three people work alongside the profiled member. | **Selection is mechanical.** `worksAlongside()` returns the next three members in document order (`src/lib/profile.ts:47–58`), not people the document pairs. The document does say the team "work as one integrated clinical team" (l.727), so the heading is not false, but the choice of three is ours. |
| B10 | `Related services` | `src/content/ui.ts:111` | 11 service pages, `<h2>` over three rows | These services are related. | **Selection is mechanical**: the next three in document order (`src/lib/treatment.ts:58–70`). |
| B11 | `Fifteen questions` / `Fifteen yes-or-no questions` | `src/content/ui.ts:86`, `src/content/seo.ts:210` | See A2, A20 | Each questionnaire has 15 yes/no questions. | **Yes.** `QUESTIONS_PER_ASSESSMENT` is pinned by `content.checks.ts`; the scorer offers only Yes/No. |
| B12 | `Score {total} of {max}`; `{answered} of {total} answered` | `src/content/ui.ts:148,152` | Questionnaire result and tally | The arithmetic. | **Yes.** `scoreAssessment()` counts one point per yes over 15 (`src/lib/assessment.ts:40–48`), matching l.1020. |
| B13 | `Eleven clinical services`, `Ten confidential self-assessments` | `src/content/seo.ts:166,174` | See A14, A16 | Counts. | **Yes**, pinned by `content.checks.ts`. |
| B14 | `Copy pending client review` | `src/content/ui.ts:57` | `/residences`, `/privacy`, `/terms` eyebrow, off production only | The copy is provisional. | **Yes**, and correctly gated: residences by `env().SITE_ENV === 'production'` (`src/app/residences/page.tsx:57–58`), legal by `isIndexable()` (`src/templates/LegalStub.tsx:27–28`). |

## 4. Section C — PLACEHOLDER strings

| Where | Strings | Prefixed `PLACEHOLDER — `? | Gated? | Finding |
| --- | --- | --- | --- | --- |
| `src/content/pages/residences.ts` | 28 (title, eyebrow, lead, 3 section titles, 5 paragraphs, 6 captions, 6 alts, 5 amenities) | **Yes, all 28.** Enforced by `residencesMarked()` in `content.checks.ts`. Nothing strips the prefix at render, so production shows `PLACEHOLDER — A private house, without a name on the gate.` as the `<h1>`. | **Partly.** The staging eyebrow shows off production. The route itself is not gated: it is in the primary nav, footer, breadcrumbs, prev/next rails, indexable, and in the sitemap (`sitemapEntries` excludes only `NOINDEX_ROUTES`). | The marking is correct. The route's visibility is the gap: a placeholder page is one click from the header in production and advertised to crawlers. See A3, A13. |
| `src/content/pages/legal.ts` | 20 (2 titles, 2 leads, 8 section titles, 8 pending sentences) | **Yes, all 20.** Enforced by `legalMarked()`. | **Yes.** `noIndex: true`, out of the sitemap, staging eyebrow off production. | Correct. The footer still links to them from every production page (A4). Their metadata descriptions are unmarked (A18, A19) and `llms.txt` lists both routes despite `noindex`. |
| `src/content/pages/contact.ts:66` | `website: 'thenewpractice.health'` | **No.** Marked only in the module comment; `PLACEHOLDER_ALLOWED` in `content.checks.ts:93` exempts this path. | Not rendered anywhere (`EnquiryTemplate.Founder` prints name, role, phone, email, locale; the footer likewise). | Unmarked but invisible. The domain also appears inside the client's email address (l.107), so it is arguably derived. Low. |
| `src/content/seo.ts:162,182,184` | Residences, privacy and terms descriptions | **No.** | Residences: no. Legal: `noindex` only; still emitted in `<head>`, OG and `llms.txt`. | See A13, A18, A19. |
| `src/app/dev/curtain/page.tsx:17–26` | 7 development strings (`Curtain harness`, `Development route`, …) | n/a | **Yes**: `notFound()` when `SITE_ENV === 'production'`. | Correct. |
| `src/content/ui.ts:57` | `Copy pending client review` | n/a (interface) | **Yes** (B14). | Correct. |

Not rendered anywhere, so not placeholders in the visible sense but worth knowing: `HOME.hero.audioScript` and `HOME.hero.videoBrief` (`src/content/pages/home.ts:15–19`), `BRAND.markStory` (`src/content/brand.ts:54`), `ASSESSMENT_SERIES.toolLabel`, `.seriesTitle` and `.supersededScale` (`src/content/assessments.ts:70–125`). A repository-wide grep finds no render-side reference to any of them.

## 5. Section D — DERIVED strings whose transformation could be questioned

| # | String as rendered | Source | Document | Transformation |
| --- | --- | --- | --- | --- |
| D1 | `A New Approach to Wellbeing` | `src/content/pages/home.ts:12` | l.13 `A NEW APPROACH TO WELLBEING` | Title-cased. Authorised (CONTENT-GAPS C6: the owner's brief specified title case). |
| D2 | `Private treatment without compromise` | `src/content/brand.ts:42`; footer, preloader, hero lockup, `<title>`, `llms.txt` | PDF lockup `PRIVATE TREATMENT WITHOUT COMPROMISE`; l.22 `Private Treatment Without Compromise` | Sentence-cased. The OG card upper-cases it back; the page lockups do not. `llms.txt` appends a full stop. |
| D3 | `Cost` (h1) vs `Fees` (nav, breadcrumb, `<title>`, OG, rail) | `src/content/pages/fees.ts:8`; `src/content/nav.ts:58`; `src/content/seo.ts:157` | l.1283 `CLOSING SECTION: Cost` | The page says one word, everything pointing at it says another. Ledger says "Fees" per the plan; the document says "Cost". |
| D4 | `Puerto Aventuras, Riviera Maya, Quintana Roo, Mexico` on the home page §5, footer, nav overlay | `src/content/brand.ts:43` | Home block l.108–110 has no `Quintana Roo`; contact block l.1248–1250 has it | Fuller form used everywhere (authorised, ledger owner decision; CONTENT-GAPS C3). The home §5 block also gains `, MA` (l.103 has no post-nominal; l.1241 does). |
| D5 | Home `<meta description>`: `The New Practice is a private behavioural health practice based in Puerto Aventuras, in Mexico’s Riviera Maya. We treat one client at a time.` | `src/content/seo.ts:105` | l.25 first sentence + l.27 | Drops the second sentence of l.25 (the conditions list) and joins two paragraphs. Sense intact. |
| D6 | `Many people we work with have experienced overwhelming or traumatic life events that continue to affect their emotional wellbeing, relationships…` | `serviceSeo()` on l.460 | l.460 | Cut mid-list at 155 characters with an ellipsis. Same for Mental Health (l.523, cut after "grief…") and Executive Health & Burnout (l.569, cut after "physical health…"). The other eight services keep whole sentences. |
| D7 | `Nathaniel Bruce, Chief Operating Officer at The New Practice.` and six similar | `teamSeo()` fallback, `src/content/seo.ts:202` | Name l.801, role l.803 | Our sentence frame around the client's name and role, used when the biography's first sentence exceeds 155 characters (Bruce, Vasquez-Whitfield, Nolan, Hames, Heyland, Neduchal, Escobosa García). No new fact. |
| D8 | `A structured trauma therapy used to help…` (and the other seven definitions) | `capitaliseFirst()` in `src/sections/ContentSection.tsx:77` | l.481 `a structured trauma therapy…` | First letter upper-cased at render because the document writes `Name: description` on one line. Display only; the module is verbatim. |
| D9 | Nine questionnaires' result line: `Moderate or severe scores indicate it may be helpful to seek professional support.` | `src/content/assessments.ts:219` etc. | l.1024, second sentence | The first sentence of l.1024 is alcohol-specific, so it was kept only for the alcohol questionnaire. Documented (G6). The nine get a sentence written for alcohol without its subject. |
| D10 | *How to Complete the Assessment* body: l.974 first sentence, then l.1020 appended | `src/app/self-assessment/page.tsx:36–38` | l.974–986 | The 0–3 scale and General Guide (l.975–986) are removed by owner decision (C1) and the yes/no scoring line from a different block is appended under the document's heading. The heading now sits over a body the document did not give it. |
| D11 | Disclaimer's first sentence set as the italic header line | `liftHeader()` at `src/app/self-assessment/page.tsx:35` and `src/templates/AssessmentTemplate.tsx:77` | l.962 | Presentation only; order intact. |
| D12 | Page lead lifted out of the first section (`/our-process`, `/contact`, `/team`) | `src/content/pages/process.ts:9`, `contact.ts:11`, `liftLead()` | l.254, l.1202, l.723 | The first sentence moves above the title; order on the page is unchanged. |
| D13 | `Warm regards,` moved into the signature block | `src/lib/letter.ts` | l.1273 | Presentation. |
| D14 | `Recovery succeeds when trust is never interrupted.` set as an italic pull line | `src/sections/home/LongRead.tsx:48–53` | l.41 last sentence | Emphasis added by us; not presented as a quotation. |
| D15 | `Every enquiry is handled with complete confidentiality.` | `src/components/Footer.tsx:93`, `src/sections/EnquireBand.tsx:27` | l.99, home §5 only | The client's sentence relocated to the footer of every page and to the closing band of every template. Verbatim, but placed where the document did not put it. |
| D16 | `The marina, quiet residential streets, tropical gardens, ancient Mayan canals, beaches and relaxed atmosphere provide an exceptional degree of privacy for individuals and families who value discretion.` | `src/lib/residences.ts:34–37`, rendered as an `<h2>` on `/residences` over the "discretion" photograph | l.193, About §3 *Privacy, Safety and Peace* | Relocated from About to the residences page and set as a display heading above a stock photograph of a person at a window. Verbatim, unattributed to its section. |
| D17 | `Self-Assessment · 01` eyebrow on each questionnaire | `src/templates/AssessmentTemplate.tsx:65` | l.1019 `THE NEW PRACTICE™ SELF-ASSESSMENT SERIES` | Our navigation label and numeral stand where the document's series title would. |
| D18 | `Team` as the list heading over the eleven members | `src/app/team/page.tsx:54` (`TEAM_PAGE.title`) | l.781 `Section 2: Meet The Team` | The client's heading is replaced by the page name. |
| D19 | `Lowell Monkhouse, Founder and Clinical Director` in metadata | `src/content/seo.ts:140` | l.104 `Founder & Clinical Director`; l.785 `Founder and Clinical Director` | `&` replaced by `and`; both forms exist in the document (C2). |
| D20 | `Our Logo - The Ceiba` | `src/content/pages/about.ts:12` | l.115 `Our Logo \- The Ceiba` | Hyphen-minus rendered literally (C9). |
| D21 | `ABOUT THE NEW PRACTICE`, `A MESSAGE FROM THE FOUNDER`, `PUERTO AVENTURAS`, `THE NEW PRACTICE EXPERIENCE`, `THANK YOU` | `about.ts`, `process.ts`, `personal-message.ts` | l.123, 143, 176, 252, 1251 | Kept in the document's capitals while sibling headings are title case. Consistent with the source; inconsistent on the page. |
| D22 | `01 / 06` plate counters, `01`–`11` ordinals, section numerals | `plateCounter()`, `numeral()` | — | Ours; the document numbers only the questionnaires and questions. Interface. |

## 6. Section E — Omissions and misattributions

Omissions that change meaning or drop the client's words:

| # | What the document has | What renders | Where |
| --- | --- | --- | --- |
| E1 | `Self Assessment Tool` (l.1018) and `THE NEW PRACTICE™ SELF-ASSESSMENT SERIES` (l.1019) | Neither renders anywhere. `ASSESSMENT_SERIES.toolLabel` and `.seriesTitle` are unused. | 10 questionnaire pages |
| E2 | `Use the following scoring system: 0 = Never … 3 = Frequently`, `Add your total score at the end of each assessment.`, the *General Guide* (l.975–986) | Removed. Owner decision (C1): the per-questionnaire yes/no scoring wins. The document's own how-to heading remains over the residue (D10). | `/self-assessment` |
| E3 | `Higher scores suggest increasing levels of problematic alcohol use.` (l.1024, first sentence) | Rendered on the alcohol questionnaire only; the other nine show the second sentence alone (D9, G6). | 9 questionnaire results |
| E4 | Contact §3 field labels `Direct Telephone:`, `Email:`, `Website:`, `Location:` (l.1243–1246) | The founder block prints the number and address as links without labels; the website line is dropped entirely (its value was blank in the document). | `/contact` |
| E5 | `Section 2: Meet The Team` (l.781) | Replaced by the page name `Team` (D18). | `/team` |
| E6 | The hero voice-over (l.8) | Not delivered; `audioSrc` is `null`, the toggle does not mount (G5). The words are in the module and nowhere on the page. | `/` |
| E7 | Home §5 founder block (l.103–110) | Rendered, but with `MA` and `Quintana Roo` added from the contact block (D4). | `/` |
| E8 | `/privacy`, `/terms` in `llms.txt` | Listed with our descriptions although both routes are `noindex` and out of the sitemap. Not an omission but an inclusion the rest of the SEO layer excludes. | `/llms.txt` |

Lists were checked item by item: *Who We Help* (12), team roles (20), the four service `treats` lists, `mayInclude` (11), after care needs (10), family program (12), *Who Contacts Us* (12), Inner Child benefits (9), the ten questionnaire titles and all 150 questions. No item is dropped, reordered or reworded.

Misattribution: none found. The two signature blocks (About founder's message, l.171–172; personal message, l.1275–1279) match the document line for line. No sentence is set in quotation marks or attributed to a person other than as the document attributes it. The manifesto (`Why The New Practice?`) and the two pull lines are the client's words presented as emphasis, not as quotations.

One adjacent note outside provenance: the About section *The Caribbean Sea* is illustrated with `hero-poster` (alt: "Sea under an overcast sky with a line of surf breaking onto a shingle beach"). The alt makes no claim, but a shingle beach under an overcast sky sits under a heading about the Caribbean. Stock imagery is authorised by the owner decision; the choice of frame is an art-direction question, not a text one.

## 7. Appendix — per-string classification

Only strings that are **not** VERBATIM are listed; everything else in a module is verbatim to the document (863 strings, plus the two hyphen-join definitions at `services.ts:110–113` and `:125–128`, which match l.490–493 and l.504–507 once the document's line-end hyphen is joined). Keys, slugs, ids, hrefs, media paths, blur data and schema vocabulary are excluded as non-textual.

### `src/content/brand.ts`

| String | Class | Source |
| --- | --- | --- |
| `The New Practice`, `THE NEW PRACTICE` | IDENTITY / VERBATIM | PDF; l.5 |
| `™` | IDENTITY | PDF page title; l.5, l.1019 |
| `Private treatment without compromise` | IDENTITY, DERIVED (case) | PDF; l.22 (D2) |
| `Puerto Aventuras, Riviera Maya, Quintana Roo, Mexico` | DERIVED (join) | l.1248–1250 (D4) |
| `+1 778-679-3369`, `lowell@thenewpractice.health`, `Lowell Monkhouse`, `MA`, `Founder & Clinical Director` | VERBATIM | l.106, 107, 103, 1241, 104 |
| `The ceiba — the Maya world tree, joining the underworld, the earthly plane and the heavens through a single trunk. Three branches rise, three roots descend, and all six meet at one point.` | IDENTITY, DERIVED from PDF; **not rendered** | PDF §The thinking behind the mark |

### `src/content/ui.ts`

| String | Class |
| --- | --- |
| `Skip to content` | INTERFACE |
| `Scroll to discover` | VERBATIM l.18 |
| `Footer`, `Sitemap`, `·` | INTERFACE |
| `©` | INTERFACE-CLAIM (B7) |
| `On this page`, `Adjacent pages`, `Previous`, `Next` | INTERFACE |
| `Ceiba pentandra · Ya’axché` | **UNSOURCED** (A1) |
| `Copy pending client review` (×2) | INTERFACE, gated (B14) |
| `Plates` | INTERFACE |
| `Amenities` | **UNSOURCED** Structural (A5) |
| `Fifteen questions` | **UNSOURCED** Structural (A2, B11) |
| `Listen`, `Mute` | INTERFACE; not rendered (no audio) |
| `Our philosophy` | DERIVED (case) l.64; `aria-label` |
| `Related services` | INTERFACE-CLAIM (B10) |
| `We provide treatment for`, `Treatment may include` | INTERFACE fallbacks; never render (every service has its own heading; l.462, l.422 anyway) |
| `Portrait to follow` | INTERFACE-CLAIM (B8) |
| `Works alongside` | INTERFACE-CLAIM (B9) |
| `Questionnaire` | DERIVED l.964 (`questionnaires`) |
| `Yes`, `No` | INTERFACE (l.1020 uses “yes”) |
| `{answered} of {total} answered`, `Score {total} of {max}` | INTERFACE-CLAIM, supported (B12) |
| `See your result`, `Start again` | INTERFACE |

### `src/content/nav.ts`

| String | Class |
| --- | --- |
| `About` | DERIVED l.112 `ABOUT US PAGE` |
| `Our Process` | DERIVED l.248 |
| `Clinical Services` | DERIVED l.400 |
| `Team` | DERIVED l.719 `OUR TEAM` |
| `Residences` | **UNSOURCED** Structural (A3) |
| `Self-Assessment` | DERIVED l.950 |
| `Enquire` (×2) | INTERFACE (document: "enquiry", l.99; "contact us directly", l.101) |
| `A Personal Message` | DERIVED l.1251 |
| `Fees` | DERIVED by owner decision; document says `Cost` l.1283 (D3) |
| `Privacy`, `Terms` | **UNSOURCED** Structural (A4) |
| `Practice`, `Care`, `Contact`, `Legal` | INTERFACE (footer group headings) |
| `Menu`, `Close`, `Primary`, `Menu` (dialog label), `Contact` (aside label) | INTERFACE |

### `src/content/enquiry.ts`

| String | Class |
| --- | --- |
| `Enquiry`, `Your enquiry` | INTERFACE |
| `Name`, `Email`, `Telephone (optional)`, `I am enquiring for`, `Message`, `Preferred contact` | INTERFACE |
| `Myself`, `Someone close to me`, `A client or colleague`, `Email`, `Telephone` | INTERFACE |
| `Please tell us your name.`, `Please keep your name under 120 characters.`, `Please enter an email address we can reply to.`, `Please tell us who the enquiry concerns.`, `Please write a few words about your situation.`, `Please keep your message under 4,000 characters.`, `Please tell us how you would prefer to be contacted.` | INTERFACE |
| `Please enter a telephone number, including the country code.` | INTERFACE-CLAIM, not supported (B6) |
| `Send`, `Sending` | INTERFACE |
| `Thank you. Your enquiry has reached us.` | INTERFACE-CLAIM, conditionally supported (B2) |
| `It will be read personally and answered in confidence.` | INTERFACE-CLAIM (B3) |
| `If the matter is urgent, please telephone.` | INTERFACE-CLAIM (B4) |
| `Your enquiry could not be sent. Please telephone or write to us directly.`, `or` | INTERFACE-CLAIM, supported (B5) |
| `Enquiry`, `Self`, `Family`, `Professional`, `enquiries` | INTERFACE; mail subject and sender, seen by the practice, not the visitor |
| `Website` | INTERFACE; honeypot label, `aria-hidden`, off-canvas |

### `src/content/seo.ts`

| String | Class |
| --- | --- |
| `The New Practice — Private treatment without compromise` (`<title>` on `/`), `THE NEW PRACTICE — Private treatment without compromise` (OG alt) | IDENTITY composition |
| `<Page> — The New Practice` (×11 titles) | INTERFACE composition of DERIVED names |
| Home description | DERIVED (D5) |
| `Home` | INTERFACE (breadcrumb, `llms.txt`) |
| About, Process, Personal Message, Fees, Residences, Team descriptions | **UNSOURCED** Descriptive (A9–A13, A15) |
| Clinical Services, Self-Assessment, Privacy, Terms descriptions | **UNSOURCED** Structural (A14, A16, A18, A19) |
| Contact description | **UNSOURCED** Claim (A17) |
| `Fees`, `Terms` (names / OG titles) | see nav |
| `Puerto Aventuras`, `Quintana Roo`, `MX` | DERIVED l.1248, 1250, 1250 |
| `en_GB`, `en` | INTERFACE (metadata) |
| `serviceSeo()` output (×11) | DERIVED truncations; three cut mid-sentence (D6) |
| `teamSeo()` output (×11) | DERIVED; 4 verbatim first sentences, 7 fallback compositions (D7) |
| `assessmentSeo()` output (×10) | **UNSOURCED** Structural + INTERFACE-CLAIM (A20, B1) |

### `src/content/pages/*.ts`

| String | Class |
| --- | --- |
| `home.ts` hero title | DERIVED (D1) |
| `home.ts` `videoBrief` | DERIVED join of l.6, 10, 11, 16, 8; **not rendered** |
| `home.ts` `audioScript` | VERBATIM l.8; **not rendered** |
| `Home`, `About`, `Our Process`, `Contact`, `Self-Assessment`, `Clinical Services`, `Team` (page titles) | DERIVED page markers |
| `fees.ts` `Cost` | VERBATIM l.1283 |
| `personal-message.ts` `A Personal Message`, `THANK YOU` | DERIVED split of l.1251 |
| `contact.ts` `website: 'thenewpractice.health'` | PLACEHOLDER, unmarked, **not rendered** (Section C) |
| `residences.ts` 28 strings | PLACEHOLDER, prefixed (Section C; facts in A.3) |
| `residences.ts` plate indices `01`–`06` | INTERFACE |
| `legal.ts` 20 strings | PLACEHOLDER, prefixed (Section C) |
| Everything else in `home.ts`, `about.ts`, `process.ts`, `personal-message.ts`, `fees.ts`, `contact.ts` | VERBATIM |

### `src/content/services.ts`, `team.ts`, `assessments.ts`

All prose, titles, roles, credentials, lists, questions, band labels (`Mild concern`, `Moderate concern`, `Severe concern`, l.1021–1023), scoring line (l.1020), instruction (l.1026) and disclaimer are VERBATIM. Exceptions:

| String | Class |
| --- | --- |
| Band keys `mild` / `moderate` / `severe` | internal, not rendered |
| Nine `interpretation` values | DERIVED truncation of l.1024 (D9, E3) |
| `toolLabel`, `seriesTitle`, `supersededScale.*` | VERBATIM l.1018–1019, l.975–986; **not rendered** (E1, E2) |
| `Founder and Clinical Director` (team) vs `Founder & Clinical Director` (brand) | both VERBATIM (l.785, l.104) |

### `src/content/media.ts`

18 `alt` strings and 18 `credit` strings: INTERFACE. Every alt describes the stock frame literally (sky, surf, corridor, linen, limestone, canopy, cenote, a person seen from behind) and asserts nothing about the practice or the place. Credits are photographer names rendered under plates as licence attribution. The three `VIDEO.*.alt` strings are not rendered (the `<video>` is `aria-hidden`).

### Rendering layer

| String | Where | Class |
| --- | --- | --- |
| `Psychiatric` | `src/lib/jsonld.ts:44` | **UNSOURCED** Claim (A6) |
| `MedicalBusiness` | `src/lib/jsonld.ts:42` | **UNSOURCED** Structural (A7) |
| `MedicalWebPage` | `src/lib/jsonld.ts:167` | **UNSOURCED** Structural (A8) |
| `Organization`, `WebSite`, `WebPage`, `Person`, `PostalAddress`, `BreadcrumbList`, `ItemList`, `ListItem`, `Thing` | `src/lib/jsonld.ts` | schema vocabulary, INTERFACE |
| `honorificSuffix` `MA`, `M.D.`, `MSc`; `jobTitle` roles; `slogan` | JSON-LD | VERBATIM / IDENTITY |
| `Pages`, `Clinical services`, `Team`, `Self-assessments`, `Contact` | `src/app/llms.txt/route.ts:65–73` | INTERFACE |
| `> Private treatment without compromise.` | `llms.txt` | IDENTITY + added full stop |
| `Telephone:`, `Email:` | `llms.txt` | VERBATIM l.106–107 |
| Summary paragraph | `llms.txt` | VERBATIM l.25, 27, 29, 41 joined |
| Wordmark, tagline (upper-cased), page short name | `src/lib/og.tsx` | IDENTITY / INTERFACE |
| `© {year} The New Practice` | `src/components/Footer.tsx` | INTERFACE-CLAIM (B7) |
| Confidentiality line | Footer, `EnquireBand` | VERBATIM l.99, relocated (D15) |
| Discretion sentence | `ResidencesTemplate` | VERBATIM l.193, relocated (D16) |
| `Self-Assessment · 0N` | `AssessmentTemplate` | INTERFACE (D17) |
| `01 / 06` | `PlateCarousel` | INTERFACE |
| `document.title` announced on navigation | `RouteCurtain` | reuses titles |
| `Curtain harness`, `Development route`, `A second page, so the curtain has somewhere to go`, `This page exists only to be navigated to and from while the route transition is built.`, three paragraphs, `Return to the lockup` | `src/app/dev/curtain/page.tsx` | INTERFACE, gated (`notFound()` in production) |
| Field placeholders | `src/components/Field.tsx:40,64` | INTERFACE (equal to the label) |
| Mail body labels and `The New Practice <enquiries@host>` | `src/server/mail.adapter.ts` | INTERFACE; seen by the practice only |

### Comments, not user-visible

`src/components/Mark.tsx:9` says "one guest, one team, one purpose" in a code comment (a leftover of the concept site's vocabulary). It renders nowhere and is out of scope; noted only so nobody promotes it to copy.
