/**
 * /team/[slug] — T4 Profile on `team.ts` (docs/05 §T4). Eleven pages, one
 * per member in document order; each composes the biography (a short opening
 * paragraph lifted to the lead when there is one), the three colleagues who
 * follow in the document, and the neighbours for the rail. Metadata and
 * structured data from the Task 10 helpers: a `Person` carrying only name,
 * credentials where the document gives them, role, employer and URL.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/JsonLd'
import { routes, teamHref } from '@/content/nav'
import { ROUTE_SEO, teamSeo } from '@/content/seo'
import { TEAM } from '@/content/team'
import { rowsFromTeam } from '@/lib/indexPage'
import { breadcrumb, organization, person, webPage } from '@/lib/jsonld'
import {
  biographyLead,
  memberBySlug,
  profileNumeral,
  profilePrevNext,
  teamIndexItem,
  worksAlongside,
} from '@/lib/profile'
import { buildMetadata } from '@/lib/seo'
import { ProfileTemplate } from '@/templates/ProfileTemplate'

type Params = Readonly<{ slug: string }>
type Props = Readonly<{ params: Promise<Params> }>

export function generateStaticParams(): Params[] {
  return TEAM.map((member) => ({ slug: member.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const member = memberBySlug(slug)
  if (!member) notFound()
  return buildMetadata({ ...teamSeo(member), path: teamHref(slug), type: 'profile' })
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const member = memberBySlug(slug)
  if (!member) notFound()

  const seo = teamSeo(member)
  const path = teamHref(slug)
  const index = teamIndexItem()
  const trail = [
    { name: ROUTE_SEO.home.name, path: routes.home },
    { name: index.label, path: index.href },
    { name: member.name, path },
  ] as const

  return (
    <>
      <JsonLd
        data={[
          person(member),
          webPage({ title: seo.title, description: seo.description, path }),
          breadcrumb(trail),
          organization(),
        ]}
      />
      <ProfileTemplate
        member={member}
        ordinal={profileNumeral(member)}
        index={index}
        biography={biographyLead(member)}
        alongside={rowsFromTeam(worksAlongside(slug))}
        prevNext={profilePrevNext(slug)}
      />
    </>
  )
}
