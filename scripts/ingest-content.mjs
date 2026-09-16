/**
 * Ingest the client document into typed content modules.
 *
 *   node scripts/ingest-content.mjs
 *
 * Reads «Final Website Instructions_DRAFT Sept 1 2026 .docx.md», strips the
 * markdown, keeps every word, and writes src/content/pages/*.ts, services.ts,
 * team.ts and assessments.ts. Deterministic and idempotent. Judgement lives in
 * ingest-content.config.mjs; line rules in ingest-content.parse.mjs; the
 * TypeScript writer in ingest-content.emit.mjs. Node built-ins only.
 *
 * Regions the generic section grammar does not fit are extracted by targeted
 * functions below and named as such: the home hero, the two founder contact
 * blocks, the assessment how-to scale and the questionnaire block.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { BRAND } from '../src/content/brand.ts'
import { UI } from '../src/content/ui.ts'
import * as cfg from './ingest-content.config.mjs'
import { compact, raw, renderModule, typeNameOf, writeModule } from './ingest-content.emit.mjs'
import {
  assert,
  lineRange,
  slugify,
  splitGroups,
  splitPages,
  splitSections,
  toBlocks,
  tokenize,
} from './ingest-content.parse.mjs'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')

const omit = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)))

// ---------------------------------------------------------------- sections

/** Ordered blocks → the section shape (paragraphs, listHeading, list, outro, definitions). */
function shapeContent(blocks) {
  const shaped = blocks.reduce(
    (acc, block) => {
      if (block.type === 'definition') {
        return {
          ...acc,
          definitions: [...acc.definitions, { term: block.term, description: block.description }],
        }
      }
      if (block.type === 'list') {
        assert(acc.list === undefined, 'a section with two lists needs targeted handling')
        const heading = acc.paragraphs.at(-1)
        const hasHeading = heading !== undefined && heading.endsWith(':')
        return {
          ...acc,
          paragraphs: hasHeading ? acc.paragraphs.slice(0, -1) : acc.paragraphs,
          listHeading: hasHeading ? heading : undefined,
          list: block.items,
        }
      }
      const key = acc.list === undefined ? 'paragraphs' : 'outro'
      return { ...acc, [key]: [...acc[key], ...block.paragraphs] }
    },
    { paragraphs: [], outro: [], definitions: [] }
  )
  const { paragraphs, listHeading, list, outro, definitions } = shaped
  return { paragraphs, listHeading, list, outro, definitions }
}

function signatureFrom(lines) {
  const [nameLine, role, organisation] = lines
  const [name, credentials] = nameLine.split(', ')
  return compact({ name, credentials, role, organisation })
}

function detachSignature(section, count) {
  if (!count) return section
  assert(section.paragraphs.length > count, `signature: too few paragraphs in ${section.id}`)
  return {
    ...section,
    paragraphs: section.paragraphs.slice(0, -count),
    signature: signatureFrom(section.paragraphs.slice(-count)),
  }
}

function subsectionFrom(group) {
  return {
    id: slugify(group.subtitle),
    title: group.subtitle,
    header: group.header,
    ...shapeContent(toBlocks(group.tokens)),
  }
}

/**
 * A section's groups: the first has no subtitle. A single subtitled group with
 * nothing before it is the section's own subtitle; otherwise every subtitled
 * group is a subsection.
 */
function buildSection(id, title, tokens) {
  const [first, ...rest] = splitGroups(tokens)
  const firstBlocks = toBlocks(first.tokens)
  if (rest.length === 1 && firstBlocks.length === 0) {
    const only = rest[0]
    return {
      id,
      title,
      subtitle: only.subtitle,
      header: only.header,
      ...shapeContent(toBlocks(only.tokens)),
    }
  }
  return {
    id,
    title,
    header: first.header,
    ...shapeContent(firstBlocks),
    subsections: rest.map(subsectionFrom),
  }
}

/** Preamble groups (before Section 1) become leading sections, one per subtitle. */
function preambleSections(tokens, introId) {
  return splitGroups(tokens)
    .filter((group) => toBlocks(group.tokens).length > 0)
    .map((group) => {
      const id = group.subtitle ? slugify(group.subtitle) : introId
      return {
        id,
        title: group.subtitle,
        header: group.header,
        ...shapeContent(toBlocks(group.tokens)),
      }
    })
}

function numberedSections(sections) {
  return sections.map((s) => buildSection(slugify(s.title), s.title, s.tokens))
}

function assertUniqueIds(sections, label) {
  const ids = sections.map((s) => s.id)
  assert(new Set(ids).size === ids.length, `${label}: duplicate section ids ${ids.join(', ')}`)
}

function liftLead(page, leadSectionId) {
  if (!leadSectionId) return page
  const target = page.sections.find((s) => s.id === leadSectionId)
  assert(
    target && target.paragraphs.length > 1,
    `lead: section ${leadSectionId} missing or too short`
  )
  const sections = page.sections.map((s) =>
    s.id === leadSectionId ? { ...s, paragraphs: s.paragraphs.slice(1) } : s
  )
  return { ...page, lead: target.paragraphs[0], sections }
}

function buildPage(meta, tokens, options = {}) {
  const { preamble, sections } = splitSections(tokens)
  const leading = options.omitPreamble ? [] : preambleSections(preamble, meta.introId ?? 'intro')
  const built = [...leading, ...numberedSections(sections)].map((s) =>
    detachSignature(s, meta.signatureLines?.[s.id])
  )
  const transformed = options.transformSections ? options.transformSections(built) : built
  assertUniqueIds(transformed, meta.slug)
  const page = {
    slug: meta.slug,
    title: meta.title,
    eyebrow: meta.eyebrow,
    lead: undefined,
    sections: transformed,
  }
  return liftLead(page, meta.lead)
}

// ---------------------------------------------------------------- targeted: founder blocks

function assertBrandLine(lines, expected, what) {
  assert(
    lines.includes(expected),
    `${what}: document says ${JSON.stringify(lines)}, brand.ts says ${expected}`
  )
}

/** The founder block the document repeats; values are references to brand.ts. */
function contactBlock(lines, { requireLocale }) {
  const founderLine = `${BRAND.founder.name}, ${BRAND.founder.credentials}`
  assert(
    lines.includes(BRAND.founder.name) || lines.includes(founderLine),
    'founder name not found in block'
  )
  assertBrandLine(lines, BRAND.founder.role, 'founder role')
  const locale = lines.filter((l) => /Puerto Aventuras|Riviera Maya|Mexico/.test(l)).join(', ')
  if (requireLocale) assert(locale === BRAND.locale, `locale: document says "${locale}"`)
  return {
    name: raw('BRAND.founder.name'),
    credentials: raw('BRAND.founder.credentials'),
    role: raw('BRAND.founder.role'),
    phone: raw('BRAND.phone'),
    email: raw('BRAND.email'),
    locale: raw('BRAND.locale'),
  }
}

/** Home §5: prose, then the founder's name opens the contact block. */
function splitHomeContact(sections) {
  return sections.map((section) => {
    if (section.id !== cfg.HOME.contactSection) return section
    const at = section.paragraphs.indexOf(BRAND.founder.name)
    assert(at > 0, 'home contact block not found')
    const lines = section.paragraphs.slice(at)
    assertBrandLine(lines, `Telephone: ${BRAND.phone}`, 'phone')
    assertBrandLine(lines, `Email: ${BRAND.email}`, 'email')
    return {
      ...section,
      paragraphs: section.paragraphs.slice(0, at),
      contact: contactBlock(lines, { requireLocale: false }),
    }
  })
}

/** Contact §3: one sentence, then name, role, three blank fields and the address. */
function splitContactPage(sections) {
  return sections.map((section) => {
    if (section.id !== cfg.CONTACT.contactSection) return section
    const [sentence, ...lines] = section.paragraphs
    assertBrandLine(lines, BRAND.name, 'organisation')
    const block = contactBlock(lines, { requireLocale: true })
    return {
      ...section,
      paragraphs: [sentence],
      contact: {
        ...block,
        organisation: raw('BRAND.name'),
        website: cfg.CONTACT.websitePlaceholder,
      },
    }
  })
}

/** Pull a `contact` field off its section up to page level. */
function hoistContact(page) {
  const owner = page.sections.find((s) => s.contact)
  assert(owner, `${page.slug}: no section carries a contact block`)
  const sections = page.sections.map((s) => omit(s, ['contact']))
  return { ...page, sections, contact: owner.contact }
}

// ---------------------------------------------------------------- targeted: home hero

function heroFrom(tokens) {
  const lines = tokens.filter((t) => t.type === 'text').map((t) => t.text)
  const field = (label) =>
    lines
      .find((l) => l.startsWith(label))
      ?.slice(label.length)
      .trim()
  const overlay = field('Video overlay title:')
  assert(
    overlay?.toLowerCase() === cfg.HOME.heroTitle.toLowerCase(),
    `hero title: document says ${overlay}`
  )
  const scriptLine = field('Audio script:')
  const spoken = scriptLine.match(/“([^”]+)”/)
  assert(spoken, 'audio script not found')
  const cue = field('ADD:')?.split(' (')[0]
  assert(cue === UI.scrollCue, `scroll cue: document says ${cue}, ui.ts says ${UI.scrollCue}`)
  const brief = [
    ...lines.filter((l) => /^(Monologue|Video:|Audio starts|Keep the ocean)/.test(l)),
    scriptLine.slice(spoken.index + spoken[0].length).trim(),
  ]
  return {
    title: cfg.HOME.heroTitle,
    subtitle: field('Sub title right under overlay title:'),
    cue: raw('UI.scrollCue'),
    audioScript: spoken[1],
    audioSrc: null,
    videoBrief: brief.join('\n'),
  }
}

// ---------------------------------------------------------------- services

function classifyLists(blocks) {
  return blocks.reduce(
    (acc, block, i) => {
      if (block.type === 'definition') return acc
      if (block.type === 'paragraphs') {
        const key = acc.seenList ? 'outro' : 'intro'
        return { ...acc, [key]: [...acc[key], ...block.paragraphs] }
      }
      const source = acc.seenList ? 'outro' : 'intro'
      const heading = acc[source].at(-1)
      assert(heading?.endsWith(':'), `service list at block ${i} has no heading`)
      const isMayInclude = cfg.SERVICES.mayIncludePattern.test(heading)
      const target = isMayInclude ? 'mayInclude' : 'treats'
      assert(acc[target] === undefined, `service has two ${target} lists`)
      return {
        ...acc,
        [source]: acc[source].slice(0, -1),
        [target]: block.items,
        [`${target}Heading`]: heading,
        seenList: true,
      }
    },
    { intro: [], outro: [], seenList: false }
  )
}

function definitionsFromColon(paragraphs) {
  return paragraphs.map((p) => {
    const at = p.indexOf(': ')
    assert(at > 0, `definition without colon: ${p.slice(0, 40)}`)
    return { term: p.slice(0, at), description: p.slice(at + 2) }
  })
}

function serviceSubsections(slug, groups) {
  const wanted = cfg.SERVICES.definitionSubsections[slug] ?? []
  return groups.map((group) => {
    const sub = subsectionFrom(group)
    if (!wanted.includes(sub.id)) return sub
    return { ...sub, paragraphs: [], definitions: definitionsFromColon(sub.paragraphs) }
  })
}

function buildService(section, index) {
  const slug = slugify(section.title)
  assert(slug === cfg.SERVICES.expectedSlugs[index], `service ${index + 1}: ${slug}`)
  const [first, ...rest] = splitGroups(section.tokens)
  const lists = classifyLists(toBlocks(first.tokens))
  return {
    slug,
    order: index + 1,
    title: section.title,
    intro: lists.intro,
    treatsHeading: lists.treatsHeading,
    treats: lists.treats,
    mayIncludeHeading: lists.mayIncludeHeading,
    mayInclude: lists.mayInclude,
    outro: lists.outro,
    subsections: serviceSubsections(slug, rest),
  }
}

// ---------------------------------------------------------------- team

function splitMembers(tokens) {
  return tokens
    .reduce(
      (groups, t) =>
        t.type === 'hr' ? [...groups, []] : [...groups.slice(0, -1), [...groups.at(-1), t]],
      [[]]
    )
    .filter((g) => g.some((t) => t.type === 'text'))
}

function memberSlug(name) {
  const bare = cfg.TEAM.honorifics.reduce((n, h) => n.replace(`${h} `, ''), name)
  return slugify(bare)
}

function buildMember(tokens, index) {
  const [nameToken, roleToken] = tokens.filter((t) => t.type === 'text')
  const [name, credentials] = nameToken.text.split(', ')
  const slug = memberSlug(name)
  assert(slug === cfg.TEAM.expectedSlugs[index], `team member ${index + 1}: ${slug}`)
  const blocks = toBlocks(tokens.slice(tokens.indexOf(roleToken) + 1))
  assert(
    blocks.every((b) => b.type === 'paragraphs'),
    `${slug}: unexpected block in biography`
  )
  const paragraphs = blocks.flatMap((b) => b.paragraphs)
  assert(paragraphs.length > 0, `${slug}: no biography`)
  return compact({ slug, order: index + 1, name, credentials, role: roleToken.text, paragraphs })
}

// ---------------------------------------------------------------- assessments

function supersededScale(section) {
  const [answer, instruction, ...tail] = section.paragraphs
  const scale = tail
    .filter((l) => /^\d = /.test(l))
    .map((l) => ({ value: Number(l[0]), label: l.slice(4) }))
  const totalNote = tail.find((l) => l.startsWith('Add your total'))
  const guideTitle = tail.find((l) => l === 'General Guide')
  const guide = tail
    .map((l) => l.match(/^(\d+–\d+|\d+ and above) — ([^:]+): (.+)$/))
    .filter(Boolean)
    .map(([, range, label, description]) => ({ range, label, description }))
  assert(
    scale.length === 4 && guide.length === 4 && totalNote && guideTitle,
    'how-to: scale block drift'
  )
  return {
    howTo: { ...section, paragraphs: [answer] },
    superseded: { instruction, scale, totalNote, guideTitle, guide },
  }
}

function bandsFrom(lines) {
  const found = lines.map((l) => l.match(/^(\d+)–(\d+): (.+)$/)).filter(Boolean)
  assert(found.length === 3, 'scoring bands drift')
  return found.map(([, min, max, label], i) => {
    const key = cfg.ASSESSMENTS.bandKeys[i]
    assert(label.toLowerCase().startsWith(key), `band ${i}: ${label}`)
    return { key, min: Number(min), max: Number(max), label }
  })
}

function questionnaires(tokens, shared) {
  const lastSentence = shared.interpretation.slice(shared.interpretation.lastIndexOf('. ') + 2)
  return tokens
    .filter((t) => t.type === 'text')
    .reduce((acc, t) => {
      const isQuestion = t.raw.startsWith('\t')
      const text = t.text.replace(/^\d+\.\s*/, '')
      if (!isQuestion) return [...acc, { title: text, questions: [] }]
      const last = acc.at(-1)
      return [...acc.slice(0, -1), { ...last, questions: [...last.questions, text] }]
    }, [])
    .map((q, i) => {
      const expected = cfg.ASSESSMENTS.questionnaires[i]
      assert(
        expected && q.title.startsWith(expected.titleStartsWith),
        `questionnaire ${i + 1}: ${q.title}`
      )
      const full = expected.slug === cfg.ASSESSMENTS.fullInterpretationSlug
      return {
        slug: expected.slug,
        order: i + 1,
        title: q.title,
        questions: q.questions,
        scoring: { perYes: 1, max: 15, bands: shared.bands },
        interpretation: full ? shared.interpretation : lastSentence,
      }
    })
}

function sharedScoring(tokens) {
  const lines = tokens
    .filter((t) => t.type === 'text' && !t.raw.startsWith('\t') && !/^\d+\. /.test(t.text))
    .map((t) => t.text)
  const [toolLabel, seriesTitle, scoringText, ...rest] = lines
  const interpretation = rest
    .find((l) => l.startsWith('Interpretation: '))
    ?.slice('Interpretation: '.length)
  const instruction = rest.find((l) => l.startsWith('Please answer'))
  assert(
    toolLabel === cfg.ASSESSMENTS.questionnaireBlockStart && interpretation && instruction,
    'scoring block drift'
  )
  return {
    toolLabel,
    seriesTitle,
    scoringText,
    instruction,
    interpretation,
    bands: bandsFrom(rest),
  }
}

function buildAssessments(meta, tokens) {
  const cut = tokens.findIndex(
    (t) => t.type === 'text' && t.text === cfg.ASSESSMENTS.questionnaireBlockStart
  )
  assert(cut > 0, 'questionnaire block not found')
  const questionnaireTokens = tokens.slice(cut)
  const shared = sharedScoring(questionnaireTokens)
  const firstTitle = questionnaireTokens.findIndex((t) => t.type === 'text' && /^1\. /.test(t.text))
  const state = { superseded: undefined }
  const page = buildPage(meta, tokens.slice(0, cut), {
    transformSections: (sections) =>
      sections.map((s) => {
        if (s.id !== cfg.ASSESSMENTS.howToSection) return s
        const { howTo, superseded } = supersededScale(s)
        state.superseded = superseded
        return howTo
      }),
  })
  const items = questionnaires(questionnaireTokens.slice(firstTitle), shared)
  const available = page.sections.find((s) => s.id === cfg.ASSESSMENTS.availableSection)
  assert(
    available && available.list.join('|') === items.map((q) => q.title).join('|'),
    'available list ≠ questionnaire titles'
  )
  const series = { ...omit(shared, ['bands', 'interpretation']), supersededScale: state.superseded }
  return { page, items, series }
}

// ---------------------------------------------------------------- modules

function pageModule(meta, page, { schema, imports = [], note }) {
  const relative = meta.file.includes('/') ? '../' : './'
  return {
    path: join(ROOT, cfg.OUT_DIR, meta.file),
    content: renderModule({
      range: page.range,
      note,
      imports: [
        { names: [typeNameOf(schema)], from: `${relative}schemas`, typeOnly: true },
        ...imports,
      ],
      exports: [{ name: meta.constName, type: typeNameOf(schema), value: compact(page.value) }],
    }),
  }
}

/** Collections are typed `readonly Type[]`; single values the type itself. */
function collectionModule(meta, range, exports, note) {
  const typeNames = [...new Set(exports.map((e) => typeNameOf(e.schema)))]
  return {
    path: join(ROOT, cfg.OUT_DIR, meta.file),
    content: renderModule({
      range,
      note,
      imports: [{ names: typeNames, from: './schemas', typeOnly: true }],
      exports: exports.map((e) => ({
        name: e.name,
        type: e.collection ? `readonly ${typeNameOf(e.schema)}[]` : typeNameOf(e.schema),
        value: compact(e.value),
      })),
    }),
  }
}

function buildAll(pages) {
  const range = (key) => lineRange(pages[key])
  const homeOptions = { transformSections: splitHomeContact, omitPreamble: true }
  const home = hoistContact(buildPage(cfg.PAGES.home, pages.home, homeOptions))
  const hero = heroFrom(splitSections(pages.home).preamble)
  const contact = hoistContact(
    buildPage(cfg.PAGES.contact, pages.contact, { transformSections: splitContactPage })
  )
  const letter = buildPage(cfg.PAGES.personalMessage, pages.personalMessage)
  const letterSection = detachSignature(
    letter.sections[0],
    cfg.PAGES.personalMessage.pageSignatureLines
  )
  const brandImport = { names: ['BRAND'], from: '../brand' }
  const services = splitSections(pages.services)
  const membersAt = pages.team.findIndex(
    (t) => t.type === 'section' && slugify(t.text) === cfg.TEAM.membersSection
  )
  assert(membersAt > 0, 'team: members section not found')
  const members = { tokens: pages.team.slice(membersAt + 1) }
  const teamPageTokens = pages.team.slice(0, membersAt)
  const assessments = buildAssessments(cfg.PAGES.assessments, pages.assessments)
  const scaleNote =
    '// ASSESSMENT_SERIES.supersededScale is the 0–3 scale from the how-to section; the owner chose the per-questionnaire yes/no scoring. Do not render it. See docs/CONTENT-GAPS.md.'
  const websiteNote =
    '// contact.website is a PLACEHOLDER: the document leaves Direct Telephone / Email / Website blank; phone and email resolve to brand.ts. See docs/CONTENT-GAPS.md.'
  return [
    pageModule(
      cfg.PAGES.home,
      {
        range: range('home'),
        value: {
          slug: home.slug,
          title: home.title,
          hero,
          sections: home.sections,
          contact: home.contact,
        },
      },
      { schema: 'homePageSchema', imports: [brandImport, { names: ['UI'], from: '../ui' }] }
    ),
    pageModule(
      cfg.PAGES.about,
      { range: range('about'), value: buildPage(cfg.PAGES.about, pages.about) },
      { schema: 'pageSchema' }
    ),
    pageModule(
      cfg.PAGES.process,
      { range: range('process'), value: buildPage(cfg.PAGES.process, pages.process) },
      { schema: 'pageSchema' }
    ),
    pageModule(
      cfg.PAGES.personalMessage,
      {
        range: range('personalMessage'),
        value: {
          ...letter,
          sections: [{ ...letterSection, signature: undefined }],
          signature: letterSection.signature,
        },
      },
      { schema: 'letterPageSchema' }
    ),
    pageModule(
      cfg.PAGES.fees,
      { range: range('fees'), value: buildPage(cfg.PAGES.fees, pages.fees) },
      { schema: 'pageSchema' }
    ),
    pageModule(
      cfg.PAGES.contact,
      { range: range('contact'), value: contact },
      { schema: 'contactPageSchema', imports: [brandImport], note: websiteNote }
    ),
    collectionModule(cfg.PAGES.services, range('services'), [
      {
        name: 'SERVICES_PAGE',
        schema: 'pageSchema',
        value: buildPage(cfg.PAGES.services, services.preamble),
      },
      {
        name: 'SERVICES',
        schema: 'serviceSchema',
        collection: true,
        value: services.sections.map(buildService),
      },
    ]),
    collectionModule(cfg.PAGES.team, range('team'), [
      { name: 'TEAM_PAGE', schema: 'pageSchema', value: buildPage(cfg.PAGES.team, teamPageTokens) },
      {
        name: 'TEAM',
        schema: 'teamMemberSchema',
        collection: true,
        value: splitMembers(members.tokens).map(buildMember),
      },
    ]),
    collectionModule(
      cfg.PAGES.assessments,
      range('assessments'),
      [
        { name: 'ASSESSMENTS_PAGE', schema: 'pageSchema', value: assessments.page },
        { name: 'ASSESSMENT_SERIES', schema: 'assessmentSeriesSchema', value: assessments.series },
        {
          name: 'ASSESSMENTS',
          schema: 'assessmentSchema',
          collection: true,
          value: assessments.items,
        },
      ],
      scaleNote
    ),
  ]
}

function main() {
  const source = readFileSync(join(ROOT, cfg.SOURCE_FILE), 'utf8')
  const pages = splitPages(tokenize(source, cfg.PAGE_MARKERS))
  const expected = Object.values(cfg.PAGE_MARKERS)
  assert(
    expected.every((k) => pages[k]?.length > 0),
    `pages found: ${Object.keys(pages).join(', ')}`
  )
  const modules = buildAll(pages)
  const results = modules.map(
    (m) => `${writeModule(m.path, m.content).padEnd(9)} ${m.path.slice(ROOT.length + 1)}`
  )
  process.stdout.write(`${results.join('\n')}\n`)
}

main()
