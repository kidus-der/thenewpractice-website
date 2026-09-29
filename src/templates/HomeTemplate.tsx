/**
 * T1 — Home (docs/05 §T1, plan §3.3). The landing page: the video hero, then
 * the client's five sections in document order: the statement with the
 * ghosted ceiba, the long read, the conditions, the philosophy with its
 * manifesto, the conversation. Takes the curated home module (round 1, R3:
 * a few of the client's sentences per section) and the media the route
 * chooses, one picture beside each of §2 to §5; contains no copy, no route
 * strings and no media keys of its own.
 *
 * Grounds (docs/02 §Ground rhythm): hero canopy; §1 canopy; §2 bone; §3
 * sand; §4 canopy; §5 bone; the footer's canopy follows. Pins: §1 and §4's
 * manifesto only, never active together. Line splits: the hero title, the
 * triad and the manifesto statement.
 */
import './HomeTemplate.css'
import type { MediaKey, VideoKey } from '@/content/media'
import type { HomePage, NavItem } from '@/content/schemas'
import type { AudioLabels } from '@/lib/audioToggle'
import { homeSections } from '@/lib/home'
import { numeral } from '@/lib/interior'
import { Conditions } from '@/sections/home/Conditions'
import { Conversation } from '@/sections/home/Conversation'
import { Hero } from '@/sections/home/Hero'
import { LongRead } from '@/sections/home/LongRead'
import { Philosophy } from '@/sections/home/Philosophy'
import { Statement } from '@/sections/home/Statement'

/** The picture beside each section, chosen by the route (design/ROUND1-IMAGE-SLOTS.md). */
export type HomePlates = Readonly<{
  longRead: MediaKey
  conditions: MediaKey
  manifesto: MediaKey
  conversation: MediaKey
}>

export type HomeTemplateProps = Readonly<{
  page: HomePage
  /** The hero loop; its poster is the LCP. */
  video: VideoKey
  plates: HomePlates
  /** Where every condition row leads. */
  conditionsHref: string
  /** The closing line action (the Enquire item from nav.ts). */
  enquire: NavItem
  ui: Readonly<{ audio: AudioLabels; pillarsIndexLabel: string }>
}>

export function HomeTemplate({
  page,
  video,
  plates,
  conditionsHref,
  enquire,
  ui,
}: HomeTemplateProps) {
  const sections = homeSections(page)

  return (
    <main id="main" className="home">
      <Hero
        hero={page.hero}
        video={video}
        audioLabels={ui.audio}
        titleId={`${page.slug}-title`}
        numeral={numeral(0)}
      />
      <Statement section={sections.statement} numeral={numeral(1)} />
      <LongRead section={sections.longRead} numeral={numeral(2)} plate={plates.longRead} />
      <Conditions
        section={sections.conditions}
        numeral={numeral(3)}
        href={conditionsHref}
        plate={plates.conditions}
      />
      <Philosophy
        section={sections.philosophy}
        manifesto={sections.manifesto}
        numeral={numeral(4)}
        indexLabel={ui.pillarsIndexLabel}
        plate={plates.manifesto}
      />
      <Conversation
        section={sections.conversation}
        contact={page.contact}
        action={enquire}
        numeral={numeral(5)}
        plate={plates.conversation}
      />
    </main>
  )
}
