import type { Metadata } from 'next'

import { JsonLd } from '@/components/JsonLd'
import { routes } from '@/content'
import { CONTACT_CURATED } from '@/content/curated/contact'
import type { MediaKey } from '@/content/media'
import { ROUTE_SEO } from '@/content/seo'
import { organization, webPage } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/seo'
import { EnquiryTemplate } from '@/templates/EnquiryTemplate'

/**
 * /contact — T7 on `pages/contact.ts` as the curation renders it (round 1,
 * R4d; docs/05 §T7). Statically rendered; the only server work is the
 * enquiry action the form posts to. The confirmation is a state of this
 * page, not a route, so there is nothing to noindex.
 */
export const metadata: Metadata = buildMetadata({ ...ROUTE_SEO.contact, path: routes.contact })

/** Two armchairs in a quiet room, beside the form (design/ROUND1-IMAGE-SLOTS.md). */
const PLATE: MediaKey = 'contact'

export default function ContactPage() {
  const seo = ROUTE_SEO.contact
  return (
    <>
      <JsonLd
        data={[
          webPage({
            title: seo.title,
            description: seo.description,
            path: routes.contact,
            breadcrumb: [
              { name: ROUTE_SEO.home.name, path: routes.home },
              { name: seo.name, path: routes.contact },
            ],
          }),
          organization(),
        ]}
      />
      <EnquiryTemplate page={CONTACT_CURATED} plate={PLATE} />
    </>
  )
}
