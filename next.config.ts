import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next 16.3's dev server otherwise appends its own block to AGENTS.md on
  // every start. That file is our single pointer to CLAUDE.md; library docs
  // come through context7 (ledger rule 3), so the generated block is noise.
  agentRules: false,
  images: {
    // Next 16 allows only listed qualities. 75 is the default; 60 is what
    // src/lib/plates.ts asks for the frames that exceed the served-size
    // budget at 75 (docs/08 §Formats and sizes).
    qualities: [60, 75],
  },
}

export default nextConfig
