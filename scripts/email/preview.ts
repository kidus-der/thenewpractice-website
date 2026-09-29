/**
 * Renders every email with sample data for review:
 *
 *   npm run email:preview        (node --experimental-strip-types scripts/email/preview.ts)
 *
 * Writes each email's HTML and plain-text parts, and an index page linking
 * them, to `email-previews/` (gitignored). The mark is inlined as a data URI
 * so a browser shows what an inbox shows through `cid:`. Sample people and
 * addresses are obviously fictional; the questionnaire and its questions are
 * the client's.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import * as nodeModule from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HAS_EXTENSION = /\.[cm]?[jt]sx?$/
const root = fileURLToPath(new URL('../../', import.meta.url))
const src = `${root}src/`

/** '@/x' to src/x, and extensionless relative imports to their .ts file, as Next and Vitest resolve them. */
nodeModule.registerHooks({
  resolve(specifier, context, next) {
    const aliased = specifier.startsWith('@/') ? pathToFileURL(src + specifier.slice(2)).href : null
    const base = aliased ?? specifier
    const relative = aliased !== null || specifier.startsWith('.')
    if (!relative || HAS_EXTENSION.test(base)) return next(base, context)
    const candidate = aliased
      ? fileURLToPath(base)
      : fileURLToPath(new URL(base, context.parentURL))
    if (existsSync(`${candidate}.ts`)) return next(`${base}.ts`, context)
    if (existsSync(`${candidate}/index.ts`)) return next(`${base}/index.ts`, context)
    return next(base, context)
  },
})

type Rendered = Readonly<{ subject: string; html: string; text: string }>

/** Loads a module from src/ by path; typed by the `import()` type beside it. */
const load = (path: string): Promise<unknown> => import(pathToFileURL(src + path).href)

const { renderEnquiryEmail } = (await load(
  'server/email/enquiry.email.ts'
)) as typeof import('../../src/server/email/enquiry.email')
const { renderAssessmentEmail } = (await load(
  'server/email/assessment.email.ts'
)) as typeof import('../../src/server/email/assessment.email')
const { MARK_PNG_BASE64 } = (await load(
  'server/email/mark.ts'
)) as typeof import('../../src/server/email/mark')
const { ASSESSMENTS } = (await load(
  'content/assessments.ts'
)) as typeof import('../../src/content/assessments')
const { answerTypesFor } = (await load(
  'content/assessment-answers.ts'
)) as typeof import('../../src/content/assessment-answers')
const { scoreAssessment } = (await load(
  'lib/assessment.ts'
)) as typeof import('../../src/lib/assessment')

type Answer = import('../../src/lib/assessment').FactAnswer | number
type AnswerType = import('../../src/content/assessment-answers').AnswerType

const OUT = `${root}email-previews/`
const options = {
  receivedAt: new Date('2026-09-29T15:05:00Z'),
  site: 'thenewpractice.health',
  markSrc: `data:image/png;base64,${MARK_PNG_BASE64}`,
}

const enquiry = {
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  telephone: '+44 20 7946 0958',
  enquiringFor: 'family' as const,
  message:
    'I am writing about my brother, who has been struggling for some time.\n\nWe would like to understand how an admission works and what the first conversation involves.',
  preferredContact: 'telephone' as const,
}

/** The `i`th item of a fixed cycle. */
const cycle = <T>(items: readonly [T, ...T[]], i: number): T => items[i % items.length] ?? items[0]

function assessmentSample(slug: string, pattern: (i: number, type: AnswerType) => Answer) {
  const assessment = ASSESSMENTS.find((a) => a.slug === slug)
  if (!assessment) throw new Error(`preview: no questionnaire ${slug}`)
  const types = answerTypesFor(slug)
  const answers = types.map((type, i) => pattern(i, type))
  const score = scoreAssessment(answers, types, assessment.scoring)
  if (score.average === null || score.band === null) throw new Error('preview: incomplete sheet')
  return {
    assessment,
    answers,
    average: score.average as number,
    bandLabel: score.band.label as string,
  }
}

const moderate = assessmentSample('alcohol', (i, type) =>
  type === 'scale' ? cycle<Answer>([6, 4, 7, 5, 3], i) : cycle<Answer>(['yes', 'no', 'maybe'], i)
)
const mild = assessmentSample('adult-children', (i, type) =>
  type === 'scale' ? cycle<Answer>([2, 1, 3], i) : 'no'
)

const emails: readonly (readonly [string, string, Rendered])[] = [
  ['enquiry', 'Enquiry, every field', renderEnquiryEmail(enquiry, options)],
  [
    'enquiry-no-telephone',
    'Enquiry, no telephone',
    renderEnquiryEmail(
      { ...enquiry, telephone: undefined, enquiringFor: 'self', preferredContact: 'email' },
      options
    ),
  ],
  [
    'assessment',
    'Self-assessment, email and telephone',
    renderAssessmentEmail(
      {
        title: moderate.assessment.title,
        questions: moderate.assessment.questions,
        answers: moderate.answers,
        average: moderate.average,
        bandLabel: moderate.bandLabel,
        contact: {
          name: 'Sam Rivera',
          email: 'sam.rivera@example.com',
          telephone: '+1 555 010 0199',
          preferredContact: 'email',
        },
      },
      options
    ),
  ],
  [
    'assessment-telephone-only',
    'Self-assessment, telephone only, longest title',
    renderAssessmentEmail(
      {
        title: mild.assessment.title,
        questions: mild.assessment.questions,
        answers: mild.answers,
        average: mild.average,
        bandLabel: mild.bandLabel,
        contact: {
          name: 'Sam Rivera',
          telephone: '+52 984 000 0000',
          preferredContact: 'telephone',
        },
      },
      options
    ),
  ],
]

mkdirSync(OUT, { recursive: true })
for (const [file, , email] of emails) {
  writeFileSync(`${OUT}${file}.html`, email.html)
  writeFileSync(`${OUT}${file}.txt`, `Subject: ${email.subject}\n\n${email.text}`)
}
const links = emails
  .map(
    ([file, label, email]) =>
      `<li><a href="${file}.html">${label}</a> (<a href="${file}.txt">text</a>): ${email.subject}</li>`
  )
  .join('\n')
writeFileSync(
  `${OUT}index.html`,
  `<!doctype html><meta charset="utf-8"><title>Email previews</title><ul>${links}</ul>\n`
)
process.stdout.write(`email:preview: ${emails.length} emails written to email-previews/\n`)
