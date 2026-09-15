/**
 * T4 — Profile (docs/05 §T4, plan §3.3). A person, presented with the same
 * restraint as the place: a title page with the portrait plate and the
 * name, the biography as one long-read section, the three colleagues who
 * follow in the document as an index list, the rail, the closing band.
 * Takes a `TeamMember` and the compositions the route makes; contains no
 * copy, no route strings and no media keys of its own.
 *
 * Grounds: title page bone; biography bone; works-alongside sand; rail
 * bone; band canopy (docs/02 §Ground rhythm — the plate frame is the one
 * sand element on the title page).
 */
import Link from 'next/link'
import './ProfileTemplate.css'
import { PortraitPlaceholder } from '@/components/PortraitPlaceholder'
import { SectionHeader } from '@/components/SectionHeader'
import type { MediaKey } from '@/content/media'
import type { NavItem, Section, TeamMember } from '@/content/schemas'
import { UI_PROFILE } from '@/content/ui'
import type { IndexRow } from '@/lib/indexPage'
import { numeral } from '@/lib/interior'
import type { BiographyLead } from '@/lib/profile'
import { Reveal } from '@/motion/Reveal'
import { ContentSection } from '@/sections/ContentSection'
import { EnquireBand } from '@/sections/EnquireBand'
import { IndexList } from '@/sections/IndexList'
import { PlateFigure } from '@/sections/PlateFigure'
import { PrevNextRail } from '@/sections/PrevNextRail'

export type ProfileTemplateProps = {
  member: TeamMember
  /** `01`–`11`, the member's place in the document. */
  ordinal: string
  /** The collection page: the eyebrow's label links back to it. */
  index: NavItem
  biography: BiographyLead
  /** The three colleagues, as index rows. */
  alongside: readonly IndexRow[]
  prevNext: Readonly<{ prev: NavItem; next: NavItem }>
  /** The member's portrait once the client supplies one; the placeholder stands in until then. */
  portrait?: MediaKey
}

const BIOGRAPHY_ID = 'biography'
const ALONGSIDE_ID = 'works-alongside'
/** The plate sits at .p-plate from 1024px: half the row at most. */
const PLATE_SIZES = '(min-width: 1024px) 50vw, 100vw'

function Portrait({ portrait }: { portrait?: MediaKey }) {
  if (portrait) return <PlateFigure media={portrait} sizes={PLATE_SIZES} />
  return (
    <Reveal variant="mask" className="profile__plate-frame">
      <PortraitPlaceholder />
    </Reveal>
  )
}

type TitlePageProps = Pick<ProfileTemplateProps, 'member' | 'ordinal' | 'index' | 'portrait'> & {
  titleId: string
  lead?: string
}

function TitlePage({ member, ordinal, index, portrait, titleId, lead }: TitlePageProps) {
  return (
    <section
      className="profile-intro"
      data-ground="light"
      data-n={numeral(0)}
      aria-labelledby={titleId}
    >
      <div className="shell grid12 profile-intro__grid">
        <div className="p-plate profile-intro__plate">
          <Portrait portrait={portrait} />
        </div>
        <div className="p-offset profile-intro__copy">
          <p className="eyebrow t-eyebrow profile-intro__eyebrow">
            <span aria-hidden="true">{ordinal}</span>
            <span className="eyebrow__rule" aria-hidden="true" />
            <Link className="link profile-intro__index" href={index.href}>
              {index.label}
            </Link>
          </p>
          <Reveal variant="lines" as="h1" id={titleId} className="t-d1 profile-intro__name">
            {member.name}
          </Reveal>
          {member.credentials && (
            <Reveal as="p" className="t-eyebrow profile-intro__credentials">
              {member.credentials}
            </Reveal>
          )}
          <Reveal as="p" className="t-lead profile-intro__role">
            {member.role}
          </Reveal>
          {lead && (
            <Reveal as="p" className="t-lead profile-intro__lead">
              {lead}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}

function Alongside({ rows, n }: { rows: readonly IndexRow[]; n: string }) {
  const titleId = `${ALONGSIDE_ID}-title`
  return (
    <section
      id={ALONGSIDE_ID}
      className="profile-alongside"
      data-ground="mid"
      data-n={n}
      aria-labelledby={titleId}
    >
      <div className="shell grid12">
        <div className="p-lead profile-alongside__head">
          <SectionHeader n={n} label={UI_PROFILE.worksAlongside} id={titleId} />
        </div>
        <div className="profile-alongside__list">
          <IndexList rows={rows} />
        </div>
      </div>
    </section>
  )
}

export function ProfileTemplate({
  member,
  ordinal,
  index,
  biography,
  alongside,
  prevNext,
  portrait,
}: ProfileTemplateProps) {
  const titleId = `${member.slug}-title`
  const section: Section = { id: BIOGRAPHY_ID, paragraphs: [...biography.paragraphs] }

  return (
    <main id="main" className="profile">
      <TitlePage
        member={member}
        ordinal={ordinal}
        index={index}
        portrait={portrait}
        titleId={titleId}
        lead={biography.lead}
      />
      <ContentSection section={section} numeral={numeral(1)} />
      <Alongside rows={alongside} n={numeral(2)} />
      <PrevNextRail {...prevNext} />
      <EnquireBand numeral={numeral(3)} />
    </main>
  )
}
