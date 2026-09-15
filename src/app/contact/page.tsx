import type { Metadata } from 'next'

import { JsonLd } from '@/components/JsonLd'
import { CONTACT, routes } from '@/content'
import { ROUTE_SEO } from '@/content/seo'
import { organization, webPage } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/seo'
import { EnquiryTemplate } from '@/templates/EnquiryTemplate'

/**
 * /contact — T7. Statically rendered; the only server work is the enquiry
 * action the form posts to. The confirmation is a state of this page, not a
 * route, so there is nothing to noindex.
 */
export const metadata: Metadata = buildMetadata({ ...ROUTE_SEO.contact, path: routes.contact })

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
      <EnquiryTemplate page={CONTACT} />
    </>
  )
}
