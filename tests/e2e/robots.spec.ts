import { expect, test } from './helpers'

/**
 * Staging and development must never be indexed (docs/11 Gate 2, task 6).
 * The server under test runs with whatever SITE_ENV the shell carries; only a
 * production target may allow crawling, so the assertion flips with it.
 */
const IS_PRODUCTION = process.env.SITE_ENV === 'production'

test.describe('robots.txt', () => {
  test('disallows every crawler when the deployment is not production', async ({ request }) => {
    test.skip(IS_PRODUCTION, 'Production robots.txt allows crawling by design')

    const response = await request.get('/robots.txt')
    expect(response.ok()).toBe(true)

    const body = await response.text()
    expect(body).toMatch(/^User-Agent: \*$/im)
    expect(body).toMatch(/^Disallow: \/$/m)
    expect(body).not.toMatch(/^Allow:/m)
    expect(body).not.toMatch(/^Sitemap:/m)
  })
})
