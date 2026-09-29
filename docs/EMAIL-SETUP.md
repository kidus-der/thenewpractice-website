# Email setup

Everything a visitor submits on the website reaches the practice as one email: an **enquiry** from `/contact`, and a **self-assessment** when a visitor chooses _Send my answers to the practice_ beneath a result. The code is complete. What remains is provisioning, on the practice's own accounts, once the practice owns its domain: five steps and three environment variables. Nothing here uses `kidusder.com`; the emails are sent from the practice's domain and nowhere else.

Until the steps below are done, the website runs the **log adapter**: a submission is validated, accepted and written to the server log as one line of non-personal facts (which form, which channel was preferred, which details were given), and no email is sent. The visitor sees the same confirmation either way.

## What the emails are

| Email           | Sent when                                                       | To                 | Reply-to                              | Subject                                                       |
| --------------- | --------------------------------------------------------------- | ------------------ | ------------------------------------- | ------------------------------------------------------------- |
| Enquiry         | the contact form is sent                                        | `ENQUIRY_TO_EMAIL` | the enquirer's email                  | `Enquiry: Self`, `Enquiry: Family` or `Enquiry: Professional` |
| Self-assessment | a visitor opts in beneath a result, ticks the consent and sends | `ENQUIRY_TO_EMAIL` | the visitor's email, if they gave one | `Self-assessment: <questionnaire title>`                      |

Both are branded HTML (the palette, the ceiba mark carried inside the message, hairlines, the Didone with safe fallbacks) with a plain-text part that says the same thing. They load nothing from the internet, carry no tracking and contain no links except `mailto:` and `tel:`. The website keeps no copy. The code: `src/server/email/` (templates), `src/server/mail.adapter.ts` (sending), `src/server/*.handler.ts` (what goes in each).

To see them without sending anything: `npm run email:preview`, then open `email-previews/index.html`.

## 1. Add Resend to the practice's Vercel project

On the practice's Vercel account, with the website's project linked (`vercel link`):

```bash
vercel integration add resend/resend-email
```

Accept the terms, choose the free plan (3,000 emails a month is far beyond what the site will send) and connect it to the website's project for **Production** (and Preview, if previews should send). The integration creates the Resend account on the practice's behalf and adds `RESEND_API_KEY` to the project. Check with `vercel env ls`. If the integration named the key differently, add it under the name the site reads:

```bash
vercel env add RESEND_API_KEY production
```

## 2. Verify the practice's domain in Resend

Open Resend from the integration (Vercel dashboard, Integrations, Resend, _Open in Resend_), then **Domains, Add domain**, and enter the practice's domain (for example `thenewpractice.health`). Choose the region nearest the practice (`us-east-1` is the usual choice for Mexico).

Resend then lists the DNS records to add. They are, in outline:

| Type  | Name                   | Value                                                 | Purpose                                       |
| ----- | ---------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `TXT` | `resend._domainkey`    | the long `p=…` key Resend shows                       | DKIM: proves the email is from the domain     |
| `MX`  | `send`                 | `feedback-smtp.<region>.amazonses.com`, priority `10` | bounce handling for the sending subdomain     |
| `TXT` | `send`                 | `v=spf1 include:amazonses.com ~all`                   | SPF: allows Resend to send for the domain     |
| `TXT` | `_dmarc` (recommended) | `v=DMARC1; p=none;`                                   | DMARC: tells inboxes what to do with failures |

Copy each value **exactly as Resend shows it**; the table is the shape, the dashboard is the truth.

Where to add them: if the domain was bought on Vercel, **Vercel dashboard, Domains, the domain, DNS Records, Add** (or `vercel dns add <domain> <name> <type> <value>`). If the domain is at another registrar, add them in that registrar's DNS settings.

Back in Resend, press **Verify**. It usually takes minutes; allow up to a few hours for DNS to spread. Leave **open tracking** and **click tracking** off in the domain's settings (they are off by default): the emails promise no tracking.

## 3. Set the recipient and the sender

```bash
vercel env add ENQUIRY_TO_EMAIL production     # the mailbox that should receive every submission
vercel env add ENQUIRY_FROM_EMAIL production   # optional: the sending address
```

- `ENQUIRY_TO_EMAIL` is the practice's own inbox (for example the founder's address). Enquiries and self-assessments both go here. It must be set: with the key but without a recipient, the site logs a `mail.misconfigured` warning and keeps logging instead of sending.
- `ENQUIRY_FROM_EMAIL` is optional. Left unset, emails come from `The New Practice <enquiries@<domain of NEXT_PUBLIC_SITE_URL>>`, which is right once the site runs on the verified domain. Set it when the site's address and the verified domain differ (a preview deployment, or a verified subdomain such as `mail.thenewpractice.health`): e.g. `enquiries@mail.thenewpractice.health`. It must be on the domain verified in step 2.
- `NEXT_PUBLIC_SITE_URL` should already be the production address; the footer of each email names its host.

## 4. Redeploy

Environment variables apply to new deployments only:

```bash
vercel --prod
```

## 5. Send a test

1. Open `/contact` on the production site, fill in the form with a name, your own email address and a short message, wait a few seconds (the form refuses anything sent within three seconds of opening), and send it.
2. Open any questionnaire under `/self-assessment`, answer every question, choose _See your result_, then _Send my answers to the practice_; give a name, choose email, give an address, tick the consent and send.
3. Both emails should arrive at `ENQUIRY_TO_EMAIL` within a minute. Check the sender, that _Reply_ addresses the person who wrote, that the mark shows at the top, and the plain-text view if the mail client offers one.
4. If nothing arrives: Resend's dashboard, _Emails_, shows every attempt and its status; `vercel logs <deployment>` shows the site's side (`enquiry.mail.sent` / `assessment.mail.sent` with the Resend id, or `…mail.failed` with the reason). A `validation_error` usually means `ENQUIRY_FROM_EMAIL` (or the site's domain) is not the verified domain.

## Environment variables, in one place

| Variable             | Required     | What it is                                                                      |
| -------------------- | ------------ | ------------------------------------------------------------------------------- |
| `RESEND_API_KEY`     | yes, to send | Added by the Resend integration. Without it the site logs instead of sending.   |
| `ENQUIRY_TO_EMAIL`   | yes, to send | The practice's inbox for every submission.                                      |
| `ENQUIRY_FROM_EMAIL` | no           | The sending address, on the verified domain. Default `enquiries@<site domain>`. |

A second recipient for self-assessments is not needed: both kinds go to the same inbox and the subject says which is which. If the practice later wants them apart, a filter on the subject prefix `Self-assessment:` does it without a code change.

## What is kept, and where

Nothing on the website: no database, no file, no cookie. Resend keeps a copy of each sent email in the practice's Resend account (its dashboard's _Emails_ list) for its retention period; the practice's inbox keeps what it receives. The server log keeps one line per event with no name, address, telephone number, message or answer in it. docs/09 §3 has the details.
