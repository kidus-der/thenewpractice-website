// Registers the jest-dom matchers (toBeInTheDocument, toHaveAttribute, …) on
// Vitest's expect for every test file. Nothing else is global: tests import
// describe / it / expect / vi explicitly.
import '@testing-library/jest-dom/vitest'
