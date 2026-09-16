'use client'

/**
 * The reveal primitive. docs/04-motion-system.md §3.
 *
 * Five variants, one component. 95% of the site's scroll motion runs through
 * here. Reveals are once:true — nothing re-animates on scroll-back.
 */
import {
  useLayoutEffect,
  useRef,
  type ComponentType,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'
import { gsap, ScrollTrigger, SplitText } from './gsap'
import { D, E, REVEAL_START, STAGGER } from './tokens'

export type RevealVariant = 'fade' | 'rise' | 'mask' | 'lines' | 'chars'

const HEADING = /^H[1-6]$/
const isHeading = (el: Element): boolean => HEADING.test(el.tagName)

/**
 * The props a reveal element actually receives. @react-three/fiber (task 3)
 * augments JSX.IntrinsicElements with three.js elements, and a JSX tag typed
 * as a bare ElementType then intersects every element's props into `never`.
 * Casting the tag to this narrow component type at the JSX site sidesteps it.
 */
type RevealElement = ComponentType<
  HTMLAttributes<HTMLElement> & {
    ref?: Ref<HTMLElement>
    'data-reveal'?: string
    'data-reveal-children'?: string
  }
>

type Props = {
  variant?: RevealVariant
  delay?: number
  stagger?: number
  /** Stagger direct children rather than the element itself. */
  staggerChildren?: boolean
  as?: ElementType
  className?: string
  children: ReactNode
  id?: string
}

export function Reveal({
  variant = 'rise',
  delay = 0,
  stagger,
  staggerChildren = false,
  as = 'div',
  className,
  children,
  id,
}: Props) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    let split: SplitText | null = null

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia(el)

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const common = {
          scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
          duration: D.slow,
          ease: E.outExpo,
          delay,
        }

        if (variant === 'lines' || variant === 'chars') {
          const run = () => {
            split = SplitText.create(el, {
              type: variant === 'lines' ? 'lines' : 'chars',
              mask: variant === 'lines' ? 'lines' : undefined,
              autoSplit: true,
              linesClass: 'split-line-inner',
              // SplitText's default names the element with an aria-label of
              // its text. A heading may carry one; on a <p> or a list item axe
              // forbids it (aria-prohibited-attr, serious; ledger Task 16), so
              // there the lines simply read in order.
              aria: isHeading(el) ? 'auto' : 'none',
            })
            const targets = variant === 'lines' ? split.lines : split.chars
            gsap.set(el, { opacity: 1 })
            gsap.from(targets, {
              ...common,
              yPercent: variant === 'lines' ? 110 : 0,
              opacity: variant === 'chars' ? 0 : 1,
              duration: variant === 'chars' ? D.glacial : D.slow,
              stagger: stagger ?? (variant === 'chars' ? STAGGER.chars : STAGGER.large),
            })
          }
          // Split after fonts settle, or line breaks land in the wrong place.
          if (document.fonts?.status === 'loaded') run()
          else document.fonts?.ready.then(run)
          return
        }

        const targets = staggerChildren ? Array.from(el.children) : el

        if (variant === 'fade') {
          gsap.to(targets, { ...common, opacity: 1, stagger: stagger ?? STAGGER.default })
        } else if (variant === 'mask') {
          gsap.to(targets, {
            ...common,
            clipPath: 'inset(0 0 0% 0)',
            stagger: stagger ?? STAGGER.default,
          })
        } else {
          gsap.to(targets, {
            ...common,
            opacity: 1,
            y: 0,
            stagger: stagger ?? STAGGER.default,
          })
        }
      })

      return () => mm.revert()
    }, el)

    return () => {
      split?.revert()
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [variant, delay, stagger, staggerChildren])

  const dataAttr =
    variant === 'lines' || variant === 'chars' ? undefined : staggerChildren ? undefined : variant
  const Tag = as as RevealElement

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      data-reveal={dataAttr}
      data-reveal-children={staggerChildren ? variant : undefined}
    >
      {children}
    </Tag>
  )
}
