/**
 * /a-personal-message — T2 Interior in the letter variant on
 * `pages/personal-message.ts` (docs/05 §T2). The title page carries the
 * client's eyebrow _THANK YOU_ and the title; the letter follows at the lead
 * register, and its closing line moves out of the prose to sit with the
 * signature (src/lib/letter.ts). Bone throughout. The route is not in the
 * primary navigation, so `prevNextFor` gives it no rail; the enquire band
 * closes it.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { routes } from '@/content/nav'
import { PERSONAL_MESSAGE } from '@/content/pages/personal-message'
import type { Page as PageContent } from '@/content/schemas'
import { ROUTE_SEO } from '@/content/seo'
import { breadcrumb, organization, webPage } from '@/lib/jsonld'
import { letterSection } from '@/lib/letter'
import { prevNextFor } from '@/lib/prevNext'
import { buildMetadata } from '@/lib/seo'
import { InteriorTemplate } from '@/templates/InteriorTemplate'

const SEO = ROUTE_SEO.personalMessage
const PATH = routes.personalMessage

export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH })

/** The module untouched; the letter's one section recomposed with its signature. */
const LETTER: PageContent = { ...PERSONAL_MESSAGE, sections: [letterSection(PERSONAL_MESSAGE)] }

const TRAIL = [
  { name: ROUTE_SEO.home.name, path: routes.home },
  { name: SEO.name, path: PATH },
] as const

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          webPage({ title: SEO.title, description: SEO.description, path: PATH }),
          breadcrumb(TRAIL),
          organization(),
        ]}
      />
      <InteriorTemplate page={LETTER} variant="letter" prevNext={prevNextFor(PATH)} />
    </>
  )
}
