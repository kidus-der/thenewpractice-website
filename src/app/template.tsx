import type { ReactNode } from 'react'
import { RouteCurtain } from '@/components/RouteCurtain'

/**
 * The App Router's per-navigation hook point: a template re-mounts its subtree
 * when the top-level segment changes, where a layout would persist.
 *
 * Kept deliberately thin. The curtain cannot keep its state here — this file
 * re-mounts at the exact moment a navigation commits, mid-choreography, and
 * does not re-mount at all between siblings of one segment (/team/a → /team/b).
 * RouteCurtain therefore holds its phase and its pending navigation at module
 * level and treats each mount as a view; see the header of that file.
 */
export default function Template({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <RouteCurtain />
      {children}
    </>
  )
}
