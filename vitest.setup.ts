// Registers the jest-dom matchers (toBeInTheDocument, toHaveAttribute, …) on
// Vitest's expect for every test file, and unmounts React Testing Library's
// trees after each test: Vitest runs without `globals`, so RTL cannot hook
// afterEach itself and a second render would otherwise find the first one's
// elements (ledger, Task 18b findings). Nothing else is global: tests import
// describe / it / expect / vi explicitly.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
