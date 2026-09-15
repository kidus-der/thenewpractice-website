/**
 * / — T1 Home on `pages/home.ts` (docs/05 §T1). The route chooses the media:
 * the surf loop (ledger, Task 2b triage) with its own poster frame as the
 * LCP, and the four index frames for the conditions list's hover plate.
 * Everything else is the template's.
 */
import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import type { MediaKey, VideoKey } from '@/content/media'
import { NAV, routes } from '@/content/nav'
import { HOME } from '@/content/pages/home'
import { ROUTE_SEO } from '@/content/seo'
import type { NavItem } from '@/content/schemas'
import { UI_HOME } from '@/content/ui'
import { organization, webPage } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/seo'
import { HomeTemplate } from '@/templates/HomeTemplate'

const SEO = ROUTE_SEO.home
const PATH = routes.home

export const metadata: Metadata = buildMetadata({ ...SEO, path: PATH })

/** The client's brief opens on surf; canopy is held for a second beat. */
const HERO_LOOP: VideoKey = 'hero-surf'

/** Jungle, sea, stone, leaf — cycled behind the twelve conditions. */
const CONDITION_PLATES = [
  'index-01',
  'index-02',
  'index-03',
  'index-04',
] as const satisfies readonly MediaKey[]

function enquireItem(): NavItem {
  const [item] = NAV.utility
  if (!item) throw new Error('nav.ts has no utility item for the home page')
  return item
}

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          webPage({ title: SEO.title, description: SEO.description, path: PATH }),
          organization(),
        ]}
      />
      <HomeTemplate
        page={HOME}
        video={HERO_LOOP}
        conditionPlates={CONDITION_PLATES}
        conditionsHref={routes.clinicalServices}
        enquire={enquireItem()}
        ui={{
          audio: { listen: UI_HOME.listen, mute: UI_HOME.mute },
          pillarsIndexLabel: UI_HOME.pillarsIndexLabel,
        }}
      />
    </>
  )
}
