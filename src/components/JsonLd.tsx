import { serializeJsonLd, type JsonLdNode } from '@/lib/jsonld'

type Props = {
  /** One node or several; several render as one script carrying an array. */
  data: JsonLdNode | readonly JsonLdNode[]
}

/**
 * Inlines structured data. Server component; the serialiser escapes anything
 * that could close the script element, so client copy containing `</script>`
 * or a stray `<` is inert.
 */
export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
