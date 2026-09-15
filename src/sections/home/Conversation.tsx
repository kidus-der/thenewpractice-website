/**
 * 05 — Begin the Conversation (docs/05 §T1, §Reusable blocks "Enquire"). The
 * client's three lines at the reading placement; on the counterweight, the
 * founder — name, credentials, role, telephone, email, location — from the
 * one source in brand.ts by way of HOME.contact, and the Enquire line action
 * to the enquiry page. Bone. The page closes here; the footer follows.
 * Server component.
 */
import Link from 'next/link'
import './Conversation.css'
import type { ContactBlock, NavItem, Section } from '@/content/schemas'
import { SectionHeader } from '@/components/SectionHeader'
import { Reveal } from '@/motion/Reveal'

type Props = Readonly<{
  section: Section
  contact: ContactBlock
  action: NavItem
  numeral: string
}>

/** tel: URIs carry digits and the leading plus only. */
const telHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`
const mailHref = (email: string): string => `mailto:${email}`

export function Conversation({ section, contact, action, numeral }: Props) {
  const headingId = `${section.id}-title`
  return (
    <section
      className="conversation"
      id={section.id}
      data-ground="light"
      data-n={numeral}
      aria-labelledby={headingId}
    >
      <div className="shell grid12 conversation__grid">
        <div className="p-lead conversation__copy">
          <SectionHeader n={numeral} label={section.title ?? ''} id={headingId} />
          <Reveal staggerChildren className="conversation__lines">
            {section.paragraphs.map((text) => (
              <p key={text} className="t-lead">
                {text}
              </p>
            ))}
          </Reveal>
        </div>

        <div className="p-offset conversation__founder">
          <Reveal as="address" className="conversation__address">
            <span className="conversation__name">
              {contact.name}
              {contact.credentials && `, ${contact.credentials}`}
            </span>
            <span className="conversation__role t-eyebrow">{contact.role}</span>
            <span className="conversation__contact">
              <a className="link t-body" href={telHref(contact.phone)}>
                {contact.phone}
              </a>
              <a className="link t-body" href={mailHref(contact.email)}>
                {contact.email}
              </a>
            </span>
            <span className="conversation__locale t-small">{contact.locale}</span>
          </Reveal>
          <Reveal className="conversation__action">
            <Link className="line-action t-eyebrow" href={action.href}>
              {action.label}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
