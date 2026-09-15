# 01 — Brand Strategy & Identity

> Everything below is the client's, from `design/brand/The New Practice - Logo Concept.pdf` and their content document, except where marked PLACEHOLDER.

## The brand

| | |
| --- | --- |
| **Name** | The New Practice™ — the ™ is kept as a separate `trademark` field so templates decide where it renders |
| **Tagline** | Private treatment without compromise |
| **Location** | Puerto Aventuras, Riviera Maya, Quintana Roo, Mexico |
| **Founder** | Lowell Monkhouse, MA — Founder & Clinical Director |
| **Mark** | The ceiba — the Maya world tree |

All of it lives in **`src/content/brand.ts`**. Nothing else in the codebase may contain the name, tagline, founder, phone, email or location as a literal. The contact page, the footer, the home page and the nav overlay all read the same object, so they cannot disagree (plan §8, R8).

## The mark

From the client's rationale, in their words:

> The symbol at the center of the mark is drawn from the ceiba tree — the sacred "world tree" of Maya belief, said to connect the underworld, the earthly plane, and the heavens through a single trunk. Three branches rise, three roots descend, and all six meet at one point. It's a direct, literal image of "one client, one team, one purpose," and it's rooted specifically in the Riviera Maya rather than being a generic wellness leaf or lotus.
>
> The single gold point at the center is the only accent color anywhere in the identity — it marks "the one" every time it appears.

### What this means for the build

**The mark is the site's central device, not decoration.** Its geometry is lifted directly from the vector in the PDF and lives in `src/components/Mark.tsx`. Every stroke is authored starting at the centre point and travelling outward, so a `stroke-dashoffset` draw always grows *from* the intersection. Keep it that way — it is the entire reason the animation means something.

Where it appears, and at what register:

| Where | Scale | Register |
| --- | --- | --- |
| Preloader (first visit in a session) | small | Drawing itself, alone on canopy. The first thing anyone sees. |
| Route curtain (every navigation after) | small | Draws outward as the canopy covers the outgoing page. |
| Header | 16px | A silent lockup mark beside the wordmark. |
| Nav overlay | corner | Draws itself once as the overlay opens. |
| Home §1 statement | ~58vh | Enormous, ghosted at 0.16, behind *One Client. One Team. One Purpose.* The gold point lands between the second and third lines. |
| About — *Our Logo — The Ceiba* | ~150px | Small, sharp, gold-pointed, on sand. The one place it is looked *at* rather than felt. |
| Footer | small | Alone, at the very bottom, after the legal line. |

**Never** recolour the gold point, add a second accent, use the mark without its point, or redraw the geometry.

## Positioning

| | |
| --- | --- |
| **Category** | Private behavioural health: addiction, trauma, eating disorders, mental health, executive burnout, family systems |
| **Audience** | Individuals and families in acute crisis, arriving by referral, by search, or by a family member's search at three in the morning |
| **Frame of reference** | Not a rehab. Not a spa. A clinical team that comes to one person — at a residence in Puerto Aventuras, at home, or wherever they are. |
| **Point of difference** | One client at a time. A live-in clinician who, when appropriate, accompanies the client home. Recovery that begins with the first conversation and continues after discharge. |
| **Reason to believe** | The client's own words: continuity, flexibility, privacy and clinical attention "that cannot be achieved within most treatment centres" |
| **Where** | The Riviera Maya. Ocean, jungle, limestone, cenote water — not an alpine clinic. |

## The one line that has to work

> **One Client. One Team. One Purpose.**

The client's own triad, in their own casing, from the home page of their document. Every template either supports that sentence or explains what it makes possible.

> The concept site said *guest*. The production site says **client**, because the copy is theirs and that is their word. The substitution is retired.

## Brand personality

Four adjectives, in priority order. When two conflict, the earlier one wins.

1. **Discreet** — says less than it knows. Never explains its own prestige.
2. **Rigorous** — clinical, evidence-anchored, unsentimental about method.
3. **Rooted** — of this place. Maya, jungle, limestone, rain, sea. Not a resort that could be anywhere.
4. **Warm** — human, not institutional. This is care, not treatment.

## Voice

The client's copy is rendered verbatim, so the voice rules below govern the small amount of **structural copy we write**: navigation labels, form labels and errors, confirmation lines, `PLACEHOLDER` residences copy, metadata descriptions, the `llms.txt` summary.

**Write like a physician who has also read a great deal of literature.**

| Do | Don't |
| --- | --- |
| Short declaratives. | Aspirational abstraction. "Embark on a transformative journey." |
| Concrete nouns. Rain, stone, hour, clinician, canopy, silence. | Wellness vocabulary used as filler. |
| Understatement. "It is unusual." | Superlatives. "The world's most exclusive." |
| Second person, sparingly. | "We" as a self-congratulating subject. |
| Full stops. | Exclamation marks. Ever. |

**Forbidden in copy we write:** journey, transformative, bespoke, luxury *(a luxury brand never says it)*, unparalleled, world-class, cutting-edge, oasis, sanctuary, elevate, curated, paradise, escape.

The client's own copy uses some of these words (*wellbeing*, *holistic*, *luxurious*). It is theirs; it is not edited. Flag concerns in `docs/CONTENT-GAPS.md`, never in the module.

**British spelling** throughout — the client's document uses it (*behavioural*, *programme*, *centre*, *individualised*), and copy we write matches it.

### On the Maya material

The ceiba is a living religious symbol, not set dressing. Two rules:

1. **State it plainly and briefly, then stop.** The client's own *Our Logo — The Ceiba* section on the About page is the one place it is explained.
2. **Never claim indigenous endorsement, spiritual authority, or "ancient wisdom" as a treatment modality.** The client's hero voice-over speaks of "the ancient energy of this land"; that is their sentence, rendered as supplied when the audio exists, and not a licence for us to extend the theme.

## Naming things in code

| Concept | Never call it | Call it |
| --- | --- | --- |
| The person in treatment | patient, user, customer, guest | **client** — the client's own word |
| The commissioning party (The New Practice) | client | **the practice** — avoids the collision above in comments and docs |
| The buildings | facility, centre, clinic, villa | **residence(s)** — the client's word |
| The treatment | package, plan | **programme**, **treatment**, **care** — as the client uses them |
| Staff | staff, employees | **the team** |
| The contact conversation | pricing, packages, rates, leads | **enquiry** |

This vocabulary applies to component names, variable names, and content keys, not just to on-screen copy.
