'use client'

/**
 * The ambient gradient. docs/04-motion-system.md §8, docs/07 §Ambient WebGL.
 *
 * One slow waterPlane in canopy, canopy-soft and stone — never brass — sitting
 * behind the home hero at low opacity. It is additive: the poster and video
 * are the deliverable, and this file can be deleted without touching anything
 * else. Never import it directly; mount <AmbientGradientLazy>, which owns the
 * eligibility gate and the dynamic import so this chunk loads on `/` only.
 *
 * Rendering pauses (R3F frameloop → 'never') whenever the wrapper leaves the
 * viewport or the tab is hidden. The shader keeps its own clock, so on resume
 * the surface is simply further along, as if it had never stopped.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useThree } from '@react-three/fiber'
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'
import { PALETTE, readToken } from '@/lib/tokens'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  className?: string
  /** Wrapper opacity. docs/05 mounts the hero instance at 0.35. */
  opacity?: number
}>

/** Shader parameters — the budget in docs/04 §8. uSpeed must stay ≤ 0.2. */
const SURFACE = {
  uSpeed: 0.16,
  uStrength: 1.5,
  uDensity: 1.2,
  uFrequency: 5.5,
  brightness: 1,
  reflection: 0.1,
  cameraDistance: 3.6,
  cameraAzimuth: 180,
  cameraPolar: 90,
} as const

const CANVAS = { pixelDensity: 1, fov: 45 } as const

const CANVAS_STYLE: CSSProperties = { position: 'absolute', inset: 0 }

type Colours = Readonly<{ one: string; two: string; three: string }>

function readColours(): Colours {
  return {
    one: readToken('--c-canopy', PALETTE.canopy),
    two: readToken('--c-canopy-soft', PALETTE.canopySoft),
    three: readToken('--c-stone', PALETTE.stone),
  }
}

/** Inside the R3F tree: flips the render loop on and off without unmounting. */
function FrameloopGate({ active }: Readonly<{ active: boolean }>) {
  const setFrameloop = useThree((state) => state.setFrameloop)
  useEffect(() => {
    setFrameloop(active ? 'always' : 'never')
  }, [active, setFrameloop])
  return null
}

/** True while `el` intersects the viewport and the document is visible. */
function useActiveWhileVisible(ref: React.RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry?.isIntersecting ?? false)
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === 'visible')
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return inView && tabVisible
}

export function AmbientGradient({ className, opacity = 1 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useActiveWhileVisible(ref)
  // Read once at mount: the tokens do not change at runtime.
  const [colours] = useState(readColours)

  return (
    <div ref={ref} className={cn('ambient', className)} style={{ opacity }} aria-hidden="true">
      <ShaderGradientCanvas
        style={CANVAS_STYLE}
        pixelDensity={CANVAS.pixelDensity}
        fov={CANVAS.fov}
        pointerEvents="none"
        powerPreference="low-power"
        lazyLoad
      >
        <FrameloopGate active={active} />
        <ShaderGradient
          control="props"
          type="waterPlane"
          animate="on"
          shader="defaults"
          lightType="3d"
          grain="off"
          enableTransition={false}
          uSpeed={SURFACE.uSpeed}
          uStrength={SURFACE.uStrength}
          uDensity={SURFACE.uDensity}
          uFrequency={SURFACE.uFrequency}
          brightness={SURFACE.brightness}
          reflection={SURFACE.reflection}
          cDistance={SURFACE.cameraDistance}
          cAzimuthAngle={SURFACE.cameraAzimuth}
          cPolarAngle={SURFACE.cameraPolar}
          color1={colours.one}
          color2={colours.two}
          color3={colours.three}
        />
      </ShaderGradientCanvas>
    </div>
  )
}
