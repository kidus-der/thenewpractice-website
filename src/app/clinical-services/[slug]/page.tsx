/**
 * /clinical-services/[slug] — T3 Treatment on `services.ts` (docs/05 §T3),
 * one route for the eleven services. The route composes: the listing's name
 * as the title page eyebrow, the rail to the neighbouring services (the ends
 * wrap to the listing), and the page's metadata and structured data. The
 * `about` in the MedicalWebPage is the service title in the client's words
 * and nothing more (docs/09 §5, the no-claims rule).
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/JsonLd'
import { routes, serviceHref } from '@/content/nav'
import { ROUTE_SEO, serviceSeo } from '@/content/seo'
import { SERVICES, SERVICES_PAGE } from '@/content/services'
import { breadcrumb, medicalWebPage, organization } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/seo'
import { serviceBySlug, servicePrevNext } from '@/lib/treatment'
import { TreatmentTemplate } from '@/templates/TreatmentTemplate'

type Params = Promise<{ slug: string }>

/** Only the eleven services exist; an unknown slug is a 404 at the edge, never a render. */
export const dynamicParams = false

export function generateStaticParams(): { slug: string }[] {
  return SERVICES.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const service = serviceBySlug(slug)
  if (!service) notFound()
  return buildMetadata({ ...serviceSeo(service), path: serviceHref(slug) })
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params
  const service = serviceBySlug(slug)
  if (!service) notFound()

  const seo = serviceSeo(service)
  const path = serviceHref(slug)
  const trail = [
    { name: ROUTE_SEO.home.name, path: routes.home },
    { name: ROUTE_SEO.clinicalServices.name, path: routes.clinicalServices },
    { name: service.title, path },
  ]

  return (
    <>
      <JsonLd
        data={[
          medicalWebPage({
            title: seo.title,
            description: seo.description,
            path,
            about: service.title,
          }),
          breadcrumb(trail),
          organization(),
        ]}
      />
      <TreatmentTemplate
        service={service}
        eyebrow={SERVICES_PAGE.title}
        prevNext={servicePrevNext(slug)}
      />
    </>
  )
}
