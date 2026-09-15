import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next 16.3's dev server otherwise appends its own block to AGENTS.md on
  // every start. That file is our single pointer to CLAUDE.md; library docs
  // come through context7 (ledger rule 3), so the generated block is noise.
  agentRules: false,
}

export default nextConfig
