import type { Page } from '@playwright/test'

/**
 * The key that moves sequential focus to every control. Plain Tab in WebKit
 * (as in Safari by default) stops only at text fields; Option+Tab reaches
 * links, buttons and radios as well, which is what the keyboard specs walk.
 */
export function tabKey(page: Page, shift = false): string {
  const webkit = page.context().browser()?.browserType().name() === 'webkit'
  const base = webkit ? 'Alt+Tab' : 'Tab'
  return shift ? `Shift+${base}` : base
}
