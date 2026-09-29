/**
 * Team — what renders of `team.ts` (round 1, R4c; docs/06 §Curation,
 * docs/05 §T4 and §T6). The client asked for less to read: the index is a
 * short title page with its picture and the eleven names straight beneath
 * it; each biography is one or two short paragraphs of the client's own
 * sentences.
 *
 * The index (`TEAM_PAGE_CURATION`):
 * - the lead is the opening's first sentence;
 * - the rest of the opening and the Clinical Director and Lead Clinician
 *   subsections do not render (Our Process tells the same story);
 * - after the names, _A Multidisciplinary Team_ keeps its twenty roles under
 *   the client's colon line, introduced by the opening's last sentence.
 *
 * The profiles (`TEAM_CURATION`): each member's paragraphs are replaced by
 * one or two built from the client's own sentences, joined where two short
 * sentences read as one paragraph. A first paragraph short enough is still
 * lifted onto the title page as the lead (`biographyLead`). Every fact is the
 * document's, in its words; the one string of ours restates Lowell
 * Monkhouse's graduate school, whose client sentence has no subject.
 * Not rendered, on purpose: Katia Rhainds's _Origin_ sentence (its en dash)
 * and Nicolas Neduchal's _Intuitive Reconnection Massage™_ sentence (the ™
 * stays out of running text, CONTENT-GAPS §3).
 */
import type { Page, Section, TeamMember } from '../schemas'
import { TEAM, TEAM_PAGE } from '../team'
import { ALL, type Curator, type ItemPick, curate, ours, sentencesOf } from './core'

const OPENING = 'intro'
const ONE_TEAM = 'one-client-one-team'
const ROLES = 'a-multidisciplinary-team'

const sectionById = (sections: readonly Section[] | undefined, id: string): Section => {
  const found = sections?.find((s) => s.id === id)
  if (!found) throw new Error(`curated/team: team.ts has no section "${id}"`)
  return found
}

export const TEAM_PAGE_CURATION = curate('teamPage', (c): Page => {
  const opening = sectionById(TEAM_PAGE.sections, OPENING)
  const roles = sectionById(sectionById(TEAM_PAGE.sections, ONE_TEAM).subsections, ROLES)
  const where = `sections.${ONE_TEAM}.subsections.${ROLES}`
  const [lead] = c.texts(opening.paragraphs, [sentencesOf(0, [0])], `sections.${OPENING}.lead`)
  return {
    ...TEAM_PAGE,
    lead,
    sections: [
      {
        ...c.section(roles, { id: ROLES, list: ALL }, where),
        paragraphs: c.texts(opening.paragraphs, [sentencesOf(2, [1])], `${where}.paragraphs`),
      },
    ],
  }
})

/** One rendered paragraph: the picks, each resolved, joined by a space. */
type Paragraph = readonly ItemPick[]

/** Per member, in document order: the paragraphs that render. */
const BIOGRAPHIES: Readonly<Record<string, readonly Paragraph[]>> = {
  // the opening sentence restates the role line above it on the title page
  'lowell-monkhouse': [
    [
      ours('Lowell is a graduate of the Hazelden Betty Ford Graduate School of Addiction Studies.'),
      sentencesOf(0, [1]),
    ],
    [sentencesOf(4, [0]), sentencesOf(5, [1])],
  ],
  'nathaniel-bruce': [[sentencesOf(2, [0])], [sentencesOf(1, [0, 1])]],
  'elena-vasquez-whitfield': [[0], [1]],
  'justin-nolan': [[0], [sentencesOf(2, [0]), sentencesOf(3, [0])]],
  'iona-hames': [[sentencesOf(5, [0])], [sentencesOf(2, [0]), sentencesOf(4, [0])]],
  'richard-warren': [
    [sentencesOf(0, [0])],
    [sentencesOf(1, [1]), sentencesOf(2, [1]), sentencesOf(4, [0])],
  ],
  'patricia-heyland': [
    [0, sentencesOf(3, [1])],
    [2, 4],
  ],
  'caroline-adams': [[sentencesOf(0, [0])], [sentencesOf(3, [0]), 4]],
  'katia-rhainds': [[sentencesOf(0, [0])], [2, sentencesOf(3, [0, 1])]],
  'nicolas-neduchal': [[0], [sentencesOf(1, [1]), 3]],
  'fernando-escobosa-garcia': [[3], [1]],
}

function biography(c: Curator, member: TeamMember): string[] {
  const where = `${member.slug}.paragraphs`
  const picks = BIOGRAPHIES[member.slug]
  // a member the document adds later renders in full until curated (the unit test flags it)
  if (picks === undefined) return c.texts(member.paragraphs, ALL, where)
  return picks.map((paragraph, i) =>
    c.texts(member.paragraphs, paragraph, `${where}[${i}]`).join(' ')
  )
}

export const TEAM_CURATION = curate('team', (c): readonly TeamMember[] =>
  TEAM.map((member) => ({ ...member, paragraphs: biography(c, member) }))
)

export const TEAM_PAGE_CURATED = TEAM_PAGE_CURATION.value
export const TEAM_CURATED = TEAM_CURATION.value
