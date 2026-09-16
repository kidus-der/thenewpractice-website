/**
 * The two contact URI builders every founder block shares (footer, nav
 * overlay, home §5, the enquiry template and its failure line). One place, so
 * a `tel:` never drifts between them (ledger, Task 7 findings).
 */

/** `tel:` URIs carry digits and the leading plus only. */
export const telHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`

export const mailHref = (email: string): string => `mailto:${email}`
