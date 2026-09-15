'use client'

/**
 * Single registration point for GSAP and its plugins.
 * Nothing else in the codebase calls gsap.registerPlugin.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
  gsap.ticker.lagSmoothing(0)
}

export { gsap, ScrollTrigger, SplitText }
